from __future__ import annotations

import json
import time
import uuid
from typing import Any

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from feature_extractor import extract_features, load_audio_for_analysis, median_aggregate_features
from model_loader import LoadedModel, load_model, predict_probability, top_voice_indicators
from risk_policy import derive_risk_level, select_threshold, suggested_action_for_risk
from schemas import AnalyzeResponse, InferenceMetadata, ScreeningResult

app = FastAPI(title="VocalHealth AI v3 Model Service", version="1.0.0")
model: LoadedModel | None = None


@app.on_event("startup")
def startup_load_model() -> None:
    global model
    start = time.time()
    model = load_model()

    print("[ML-SERVICE] -----------------------------------------------")
    print("[ML-SERVICE] model loaded")
    print(f"[ML-SERVICE] model_name={model.model_name}")
    print(f"[ML-SERVICE] model_hash={model.artifact_hash}")
    print(f"[ML-SERVICE] feature_count={len(model.feature_cols)} acoustic={len(model.acoustic_cols)} meta={len(model.meta_cols)}")
    print(f"[ML-SERVICE] threshold_high_sensitivity={model.thresholds.get('phq_mod_plus', float('nan')):.3f}")
    print(f"[ML-SERVICE] threshold_balanced={model.thresholds_balanced.get('phq_mod_plus', float('nan')):.3f}")
    print(f"[ML-SERVICE] startup_ms={int((time.time() - start) * 1000)}")
    print("[ML-SERVICE] -----------------------------------------------")


@app.get("/healthz")
def healthz() -> dict[str, Any]:
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    return {
        "status": "ok",
        "model_name": model.model_name,
        "model_hash": model.artifact_hash,
        "thresholds": {
            "high_sensitivity": model.thresholds.get("phq_mod_plus"),
            "balanced": model.thresholds_balanced.get("phq_mod_plus"),
        },
    }


def _parse_metadata(raw: str) -> InferenceMetadata:
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"metadata is not valid JSON: {exc}") from exc

    try:
        return InferenceMetadata.model_validate(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"metadata validation failed: {exc}") from exc


@app.post("/v1/analyze/phq", response_model=AnalyzeResponse)
async def analyze_phq(
    rainbow_audio: UploadFile = File(...),
    free_speech_audio: UploadFile = File(...),
    metadata: str = Form(...),
) -> AnalyzeResponse:
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    request_id = f"ana-{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}"
    started = time.time()

    metadata_obj = _parse_metadata(metadata)

    try:
        rainbow_bytes = await rainbow_audio.read()
        free_speech_bytes = await free_speech_audio.read()

        rainbow_signal, rainbow_sr = load_audio_for_analysis(rainbow_bytes)
        free_signal, free_sr = load_audio_for_analysis(free_speech_bytes)

        rainbow_features = extract_features(rainbow_signal, rainbow_sr, model.acoustic_cols)
        free_features = extract_features(free_signal, free_sr, model.acoustic_cols)

        acoustic_features = median_aggregate_features([rainbow_features, free_features], model.acoustic_cols)

        metadata_features = {
            "age_num": float(metadata_obj.age_num),
            "is_female": float(metadata_obj.is_female),
            "edu_num": float(metadata_obj.edu_num),
            "sr_depression": float(metadata_obj.sr_depression),
            "sr_gad": float(metadata_obj.sr_gad),
            "sr_ptsd": float(metadata_obj.sr_ptsd),
            "sr_insomnia": float(metadata_obj.sr_insomnia),
            "sr_bipolar": float(metadata_obj.sr_bipolar),
            "sr_panic": float(metadata_obj.sr_panic),
            "sr_soc_anx_dis": float(metadata_obj.sr_soc_anx_dis),
            "sr_ocd": float(metadata_obj.sr_ocd),
            "any_psych_sr": float(metadata_obj.any_psych_sr),
        }

        merged_features: dict[str, float] = {**acoustic_features, **metadata_features}
        probability, vector, computed = predict_probability(model, merged_features)

        threshold_high = float(model.thresholds.get("phq_mod_plus", 0.057))
        threshold_balanced = float(model.thresholds_balanced.get("phq_mod_plus", 0.091))
        threshold = float(select_threshold(threshold_balanced, threshold_high, metadata_obj.threshold_mode))

        risk_level = derive_risk_level(probability, threshold_balanced, threshold_high)
        flag = bool(probability >= threshold)
        indicators = top_voice_indicators(model, acoustic_features, limit=4)

        total_features = len(model.feature_cols)
        missing_features = int(total_features - computed)

        caveats: list[str] = []
        if missing_features > int(total_features * 0.25):
            caveats.append("More than 25% of features were missing and imputed by the model pipeline.")
        if len(rainbow_signal) / rainbow_sr < 20 or len(free_signal) / free_sr < 20:
            caveats.append("One or more recordings were under 20 seconds and may reduce stability.")

        processing_ms = int((time.time() - started) * 1000)

        print("[ML-SERVICE] -----------------------------------------------")
        print(f"[ML-SERVICE] request_id={request_id}")
        print(f"[ML-SERVICE] durations rainbow={len(rainbow_signal)/rainbow_sr:.1f}s free={len(free_signal)/free_sr:.1f}s")
        print(f"[ML-SERVICE] feature_coverage computed={computed} missing={missing_features} total={total_features}")
        print(
            f"[ML-SERVICE] phq_mod_plus prob={probability*100:.1f}% threshold={threshold:.3f} "
            f"mode={metadata_obj.threshold_mode} risk={risk_level} flag={flag}"
        )
        for item in indicators:
            print(f"[ML-SERVICE] top_indicator {item['feature']} z={item['z_score']:.3f} direction={item['direction']}")
        if caveats:
            print(f"[ML-SERVICE] caveats={' | '.join(caveats)}")
        if metadata_obj.transcript:
            print(f"[ML-SERVICE] transcript_length={len(metadata_obj.transcript)}")
        print(f"[ML-SERVICE] processing_ms={processing_ms}")
        print("[ML-SERVICE] -----------------------------------------------")

        screening = ScreeningResult(
            probability=probability,
            threshold=threshold,
            threshold_balanced=threshold_balanced,
            threshold_high_sensitivity=threshold_high,
            threshold_mode=metadata_obj.threshold_mode,
            flag=flag,
            auc=model.aucs.get("phq_mod_plus"),
        )

        return AnalyzeResponse(
            request_id=request_id,
            model_version=f"{model.model_name}:{model.artifact_hash}",
            screening={"phq_mod_plus": screening},
            risk_level=risk_level,
            top_voice_indicators=indicators,
            suggested_action=suggested_action_for_risk(risk_level),
            n_features_computed=computed,
            feature_coverage={"total": total_features, "computed": computed, "missing": missing_features},
            processing_ms=processing_ms,
            caveats=caveats,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {exc}") from exc
