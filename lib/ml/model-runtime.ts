import artifact from "@/lib/ml/model-artifact.v2.json";
import { deriveRiskLevel } from "@/lib/ml/risk-banding";
import type {
  AudioAnalysisInput,
  AudioAnalysisResult,
  FeatureContribution,
  FeatureMap,
  ModelTargetResult,
  RiskLevel
} from "@/lib/types";

type TargetArtifact = {
  imputer: number[];
  scaler_mean: number[];
  scaler_scale: number[];
  coef: number[];
  intercept: number;
  classes: number[];
};

type ModelArtifact = {
  artifact_version: string;
  model_name: string;
  feature_cols: string[];
  acoustic_cols: string[];
  meta_cols: string[];
  active_features: string[];
  thresholds: Record<string, number>;
  thresholds_balanced: Record<string, number>;
  targets: Record<string, TargetArtifact>;
};

const modelArtifact = artifact as ModelArtifact;

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRawValue(feature: string, acousticFeatures: FeatureMap, metaFeatures: FeatureMap): number | null {
  const v = acousticFeatures[feature] ?? metaFeatures[feature] ?? null;
  if (v === null) return null;
  if (!Number.isFinite(v)) return null;
  return v;
}

function getTopContributors(
  features: string[],
  contributions: number[],
  normalizedValues: number[],
  rawValues: number[],
  direction: "positive" | "negative"
): FeatureContribution[] {
  const ranked = features
    .map((feature, i) => ({
      feature,
      contribution: contributions[i],
      normalizedValue: normalizedValues[i],
      rawValue: rawValues[i]
    }))
    .filter((item) => Number.isFinite(item.contribution) && Number.isFinite(item.normalizedValue));

  const sorted = ranked.sort((a, b) => (direction === "positive" ? b.contribution - a.contribution : a.contribution - b.contribution));
  return sorted.slice(0, 5);
}

function buildSummary(overallRisk: RiskLevel): { summary: string; recommendedFollowUp: string } {
  if (overallRisk === "high") {
    return {
      summary: "Elevated screening signal detected. Provider review is recommended before the visit.",
      recommendedFollowUp: "Route to clinical staff queue and prioritize symptom clarification during intake."
    };
  }

  if (overallRisk === "medium") {
    return {
      summary: "Moderate screening signal detected with mixed indicators.",
      recommendedFollowUp: "Include this analysis in provider prep notes and review patient-reported symptom timeline."
    };
  }

  return {
    summary: "Low screening signal detected in this recording and metadata snapshot.",
    recommendedFollowUp: "Proceed with routine care workflow and retain analysis for context."
  };
}

export function getModelFeatureCatalog() {
  return {
    featureCols: modelArtifact.feature_cols,
    acousticCols: modelArtifact.acoustic_cols,
    metaCols: modelArtifact.meta_cols,
    activeFeatures: modelArtifact.active_features
  };
}

export function runModelInference(input: AudioAnalysisInput, requestId: string): AudioAnalysisResult {
  const features = modelArtifact.feature_cols;

  let observedAcousticCount = 0;
  let observedMetaCount = 0;
  let imputedAcousticCount = 0;
  let imputedMetaCount = 0;
  const rawFeatureValues: Array<number | null> = [];

  for (let i = 0; i < features.length; i += 1) {
    const feature = features[i];
    const raw = getRawValue(feature, input.acousticFeatures, input.metaFeatures);
    rawFeatureValues.push(raw);

    const isAcoustic = modelArtifact.acoustic_cols.includes(feature);
    if (raw === null) {
      if (isAcoustic) imputedAcousticCount += 1;
      else imputedMetaCount += 1;
    } else if (isAcoustic) {
      observedAcousticCount += 1;
    } else {
      observedMetaCount += 1;
    }
  }

  const targetResults: ModelTargetResult[] = Object.entries(modelArtifact.targets).map(([targetName, targetArtifact]) => {
    let logit = targetArtifact.intercept;

    const normalizedValues: number[] = [];
    const rawValues: number[] = [];
    const contributions: number[] = [];

    for (let i = 0; i < features.length; i += 1) {
      const raw = rawFeatureValues[i];
      const effectiveRaw = raw ?? targetArtifact.imputer[i];

      const scale = targetArtifact.scaler_scale[i] || 1;
      const normalized = scale !== 0 ? (effectiveRaw - targetArtifact.scaler_mean[i]) / scale : 0;
      const contribution = normalized * targetArtifact.coef[i];

      normalizedValues.push(normalized);
      rawValues.push(effectiveRaw);
      contributions.push(contribution);

      logit += contribution;
    }

    const probability = sigmoid(logit);
    const threshold = modelArtifact.thresholds[targetName] ?? 0.5;
    const thresholdBalanced = modelArtifact.thresholds_balanced[targetName] ?? threshold;
    const margin = probability - threshold;

    return {
      name: targetName,
      probability,
      threshold,
      thresholdBalanced,
      riskLevel: deriveRiskLevel(probability, threshold),
      margin,
      topPositiveContributors: getTopContributors(features, contributions, normalizedValues, rawValues, "positive"),
      topNegativeContributors: getTopContributors(features, contributions, normalizedValues, rawValues, "negative")
    };
  });

  const worstOrder: RiskLevel[] = ["high", "medium", "low"];
  const overallRisk = worstOrder.find((level) => targetResults.some((target) => target.riskLevel === level)) ?? "low";

  const strongest = [...targetResults].sort((a, b) => b.margin - a.margin)[0];
  const maxMarginAbs = Math.max(...targetResults.map((target) => Math.abs(target.margin)));

  const observedTotal = observedAcousticCount + observedMetaCount;
  const totalFeatures = features.length;
  const observedRatio = totalFeatures > 0 ? observedTotal / totalFeatures : 0;

  const confidence = clamp(0.35 + observedRatio * 0.4 + Math.min(0.18, maxMarginAbs), 0.05, 0.95);

  const caveats: string[] = [];
  if (imputedAcousticCount > Math.floor(modelArtifact.acoustic_cols.length * 0.5)) {
    caveats.push("More than half of acoustic features were imputed from training statistics.");
  }
  if (imputedMetaCount > 0) {
    caveats.push("Some metadata fields were missing and imputed.");
  }

  const riskFlags = targetResults
    .filter((target) => target.riskLevel === "high")
    .map((target) => `${target.name} above threshold`);

  if (riskFlags.length === 0) {
    riskFlags.push("No target significantly above threshold");
  }

  const { summary, recommendedFollowUp } = buildSummary(overallRisk);

  return {
    requestId,
    modelVersion: modelArtifact.artifact_version,
    summary,
    riskFlags,
    confidence,
    recommendedFollowUp,
    targets: targetResults,
    aggregate: {
      overallRisk,
      strongestSignalTarget: strongest?.name ?? "any_mod_plus",
      caveats
    },
    quality: {
      observedAcousticCount,
      imputedAcousticCount,
      observedMetaCount,
      imputedMetaCount,
      confidenceModifier: observedRatio
    }
  };
}
