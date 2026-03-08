from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


ThresholdMode = Literal["balanced", "high_sensitivity"]


class InferenceMetadata(BaseModel):
    age_num: float = Field(..., ge=16, le=95)
    is_female: int = Field(..., ge=0, le=1)
    edu_num: float = Field(..., ge=1, le=5)

    sr_depression: int = Field(..., ge=0, le=1)
    sr_gad: int = Field(..., ge=0, le=1)
    sr_ptsd: int = Field(..., ge=0, le=1)
    sr_insomnia: int = Field(..., ge=0, le=1)
    sr_bipolar: int = Field(..., ge=0, le=1)
    sr_panic: int = Field(..., ge=0, le=1)
    sr_soc_anx_dis: int = Field(..., ge=0, le=1)
    sr_ocd: int = Field(..., ge=0, le=1)
    any_psych_sr: int = Field(..., ge=0, le=1)

    threshold_mode: ThresholdMode = "balanced"
    transcript: str = Field(default="", max_length=1000)


class VoiceIndicator(BaseModel):
    feature: str
    value: float
    z_score: float
    direction: Literal["higher_than_reference", "lower_than_reference"]


class NonTechnicalPattern(BaseModel):
    label: str
    direction: Literal["higher than typical reference", "lower than typical reference"]


class NonTechnicalSummary(BaseModel):
    overall_result: str
    risk_level: Literal["low", "medium", "high"]
    score_percent: float
    alert_level_percent: float
    threshold_mode: ThresholdMode
    rainbow_duration_seconds: float
    free_speech_duration_seconds: float
    recording_length_quality: Literal["Good length", "Somewhat short", "Very short"]
    usable_signals_computed: int
    usable_signals_total: int
    data_quality_percent: float
    data_quality_band: Literal["Excellent", "Good", "Fair", "Limited", "Unknown"]
    notable_voice_patterns: list[NonTechnicalPattern]
    caveats: list[str]


class ScreeningResult(BaseModel):
    probability: float
    threshold: float
    threshold_balanced: float
    threshold_high_sensitivity: float
    threshold_mode: ThresholdMode
    flag: bool
    auc: float | None = None


class AnalyzeResponse(BaseModel):
    request_id: str
    model_version: str
    screening: dict[str, ScreeningResult]
    risk_level: Literal["low", "medium", "high"]
    top_voice_indicators: list[VoiceIndicator]
    suggested_action: str
    n_features_computed: int
    feature_coverage: dict[str, int]
    processing_ms: int
    caveats: list[str]
    non_technical_summary: NonTechnicalSummary
