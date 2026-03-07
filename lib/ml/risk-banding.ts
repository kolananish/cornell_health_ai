import type { RiskLevel } from "@/lib/types";

export const RISK_DELTA = 0.08;

export function deriveRiskLevel(probability: number, threshold: number): RiskLevel {
  if (probability > threshold + RISK_DELTA) return "high";
  if (probability < threshold - RISK_DELTA) return "low";
  return "medium";
}
