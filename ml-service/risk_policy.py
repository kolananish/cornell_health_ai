from __future__ import annotations

from typing import Literal

ThresholdMode = Literal["balanced", "high_sensitivity"]
RiskLevel = Literal["low", "medium", "high"]


def select_threshold(
    threshold_balanced: float,
    threshold_high_sensitivity: float,
    mode: ThresholdMode,
) -> float:
    return threshold_balanced if mode == "balanced" else threshold_high_sensitivity


def derive_risk_level(
    probability: float,
    threshold_balanced: float,
    threshold_high_sensitivity: float,
) -> RiskLevel:
    low_bar = min(threshold_balanced, threshold_high_sensitivity)
    high_bar = max(threshold_balanced, threshold_high_sensitivity)

    if probability < low_bar:
        return "low"
    if probability < high_bar:
        return "medium"
    return "high"


def suggested_action_for_risk(risk_level: RiskLevel) -> str:
    if risk_level == "high":
        return "Elevated depression screening signal. Administer PHQ-9 and prioritize clinician follow-up."
    if risk_level == "medium":
        return "Moderate screening signal. Consider PHQ-9 during this visit and review symptom trajectory."
    return "Low screening signal. Continue standard care workflow and monitor over time."
