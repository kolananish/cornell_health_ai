from __future__ import annotations

import hashlib
import importlib
import os
import sys
import types
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
DELIVERABLES_DIR = ROOT / "deliverables"
DEFAULT_MODEL_PATH = DELIVERABLES_DIR / "psych_screener_v3.joblib"


@dataclass
class LoadedModel:
    pipeline: Any
    feature_cols: list[str]
    acoustic_cols: list[str]
    meta_cols: list[str]
    thresholds: dict[str, float]
    thresholds_balanced: dict[str, float]
    aucs: dict[str, float]
    reference_stats: dict[str, dict[str, float]]
    artifact_hash: str
    model_name: str


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


def _ensure_import_paths() -> None:
    deliverables = str(DELIVERABLES_DIR)
    if deliverables not in sys.path:
        sys.path.insert(0, deliverables)


def _ensure_module(name: str) -> types.ModuleType:
    if name in sys.modules:
        return sys.modules[name]
    try:
        return importlib.import_module(name)
    except Exception:  # noqa: BLE001
        pass
    module = types.ModuleType(name)
    module.__package__ = name.rpartition(".")[0]
    module.__path__ = []  # type: ignore[attr-defined]
    sys.modules[name] = module
    parent_name, _, child_name = name.rpartition(".")
    if parent_name:
        parent = _ensure_module(parent_name)
        setattr(parent, child_name, module)
    return module


def _install_tabpfn_legacy_aliases() -> None:
    """Map legacy TabPFN module paths only when they are actually missing."""
    module_aliases = {
        "tabpfn.architectures.base.transformer": "tabpfn.model.transformer",
        "tabpfn.architectures.base.layer": "tabpfn.model.layer",
        "tabpfn.architectures.base.attention.full_attention": "tabpfn.model.multi_head_attention",
        "tabpfn.architectures.base.mlp": "tabpfn.model.mlp",
        "tabpfn.architectures.base.bar_distribution": "tabpfn.model.bar_distribution",
        "tabpfn.architectures.base.config": "tabpfn.model.config",
        "tabpfn.architectures.base.thinking_tokens": "tabpfn.model.transformer",
        "tabpfn.architectures.encoders.pipeline_interfaces": "tabpfn.model.encoders",
        "tabpfn.architectures.encoders.steps.remove_empty_features_encoder_step": "tabpfn.model.encoders",
        "tabpfn.architectures.encoders.steps.nan_handling_encoder_step": "tabpfn.model.encoders",
        "tabpfn.architectures.encoders.steps.normalize_feature_groups_encoder_step": "tabpfn.model.encoders",
        "tabpfn.architectures.encoders.steps.feature_transform_encoder_step": "tabpfn.model.encoders",
        "tabpfn.architectures.encoders.steps.feature_group_projections_encoder_step": "tabpfn.model.encoders",
        "tabpfn.inference_config": "tabpfn.model.config",
    }

    for legacy_path, target_path in module_aliases.items():
        try:
            importlib.import_module(legacy_path)
            continue
        except Exception:  # noqa: BLE001
            pass
        try:
            target_module = importlib.import_module(target_path)
        except Exception:  # noqa: BLE001
            continue
        legacy_module = _ensure_module(legacy_path)
        for key, value in target_module.__dict__.items():
            if key.startswith("__"):
                continue
            if not hasattr(legacy_module, key):
                setattr(legacy_module, key, value)


def load_model() -> LoadedModel:
    _ensure_import_paths()
    _install_tabpfn_legacy_aliases()

    # Ensure custom classes are importable for joblib unpickling.
    import psych_models  # noqa: F401

    model_path = Path(os.environ.get("ML_MODEL_PATH", str(DEFAULT_MODEL_PATH))).resolve()
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")

    bundle = joblib.load(model_path)

    pipeline = bundle.get("pipeline")
    if pipeline is None:
        pipelines = bundle.get("pipelines", {})
        pipeline = pipelines.get("phq_mod_plus")

    if pipeline is None:
        raise ValueError("Model bundle missing 'pipeline'/'pipelines.phq_mod_plus'.")

    feature_cols = list(bundle.get("feature_cols", []))
    acoustic_cols = list(bundle.get("acoustic_cols", []))
    meta_cols = list(bundle.get("meta_cols", []))

    if not feature_cols:
        raise ValueError("Model bundle missing feature_cols.")

    thresholds = dict(bundle.get("thresholds", {}))
    thresholds_balanced = dict(bundle.get("thresholds_balanced", {}))
    aucs = dict(bundle.get("aucs", {}))

    if "phq_mod_plus" not in thresholds:
        thresholds["phq_mod_plus"] = float(bundle.get("threshold", 0.057))
    if "phq_mod_plus" not in thresholds_balanced:
        thresholds_balanced["phq_mod_plus"] = float(bundle.get("threshold_balanced", 0.091))

    if "phq_mod_plus" not in aucs and "auc" in bundle:
        aucs["phq_mod_plus"] = float(bundle["auc"])

    return LoadedModel(
        pipeline=pipeline,
        feature_cols=feature_cols,
        acoustic_cols=acoustic_cols,
        meta_cols=meta_cols,
        thresholds=thresholds,
        thresholds_balanced=thresholds_balanced,
        aucs=aucs,
        reference_stats=dict(bundle.get("reference_stats", {})),
        artifact_hash=_sha256(model_path),
        model_name=str(bundle.get("model_name", "psych_screener_v3")),
    )


def predict_probability(model: LoadedModel, feature_map: dict[str, float]) -> tuple[float, np.ndarray, int]:
    vector = np.array([feature_map.get(name, np.nan) for name in model.feature_cols], dtype=float)
    matrix = vector.reshape(1, -1)
    proba = float(model.pipeline.predict_proba(matrix)[0, 1])
    computed = int(np.isfinite(vector).sum())
    return proba, vector, computed


def top_voice_indicators(
    model: LoadedModel,
    acoustic_features: dict[str, float],
    limit: int = 4,
) -> list[dict[str, float | str]]:
    scored: list[dict[str, float | str]] = []

    for feature, value in acoustic_features.items():
        if not np.isfinite(value):
            continue

        ref = model.reference_stats.get(feature)
        if not ref:
            continue

        mean = ref.get("mean")
        std = ref.get("std")
        if mean is None or std is None or std <= 1e-8:
            continue

        z = (value - mean) / std
        scored.append(
            {
                "feature": feature,
                "value": float(value),
                "z_score": float(z),
                "direction": "higher_than_reference" if z >= 0 else "lower_than_reference",
            }
        )

    scored.sort(key=lambda item: abs(float(item["z_score"])), reverse=True)
    return scored[:limit]
