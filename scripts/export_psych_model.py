#!/usr/bin/env python3
"""Export psych_screener_v2.joblib into a JSON artifact consumable by Next.js runtime.

Usage:
  python3 scripts/export_psych_model.py \
    --joblib psych_screener_v2.joblib \
    --metadata psych_screener_v2_metadata.json \
    --output lib/ml/model-artifact.v2.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib


def to_float_list(values):
    return [float(v) for v in values]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--joblib", default="psych_screener_v2.joblib")
    parser.add_argument("--metadata", default="psych_screener_v2_metadata.json")
    parser.add_argument("--output", default="lib/ml/model-artifact.v2.json")
    args = parser.parse_args()

    joblib_path = Path(args.joblib)
    metadata_path = Path(args.metadata)
    output_path = Path(args.output)

    bundle = joblib.load(joblib_path)
    metadata = json.loads(metadata_path.read_text())

    feature_cols = bundle["feature_cols"]
    acoustic_cols = bundle["acoustic_cols"]
    meta_cols = bundle["meta_cols"]

    targets = {}
    for target_name, pipeline in bundle["pipelines"].items():
        imputer = pipeline.named_steps["imputer"]
        scaler = pipeline.named_steps["scaler"]
        clf = pipeline.named_steps["clf"]

        targets[target_name] = {
            "imputer": to_float_list(imputer.statistics_),
            "scaler_mean": to_float_list(scaler.mean_),
            "scaler_scale": to_float_list(scaler.scale_),
            "coef": to_float_list(clf.coef_[0]),
            "intercept": float(clf.intercept_[0]),
            "classes": [int(x) for x in clf.classes_],
        }

    artifact = {
        "artifact_version": "psych_screener_v2_json_runtime_1",
        "model_name": bundle.get("model_name", metadata.get("model_name", "unknown")),
        "feature_cols": feature_cols,
        "acoustic_cols": acoustic_cols,
        "meta_cols": meta_cols,
        "active_features": bundle.get("active_features", metadata.get("active_features", [])),
        "thresholds": metadata.get("thresholds", bundle.get("thresholds", {})),
        "thresholds_balanced": metadata.get("thresholds_balanced", bundle.get("thresholds_balanced", {})),
        "aucs": metadata.get("aucs", bundle.get("aucs", {})),
        "aps": metadata.get("aps", bundle.get("aps", {})),
        "product_tasks": metadata.get("product_tasks", bundle.get("product_tasks", [])),
        "targets": targets,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, indent=2))

    print(f"wrote {output_path}")
    print(f"targets: {list(targets.keys())}")
    print(f"feature count: {len(feature_cols)}")


if __name__ == "__main__":
    main()
