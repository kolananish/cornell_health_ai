import type { AnalysisAdapter, AudioAnalysisInput, AudioAnalysisResult } from "@/lib/types";

export class MockAnalysisAdapter implements AnalysisAdapter {
  async analyze(input: AudioAnalysisInput): Promise<AudioAnalysisResult> {
    const prolonged = input.durationSeconds > 40;
    const confidence = prolonged ? 0.84 : 0.71;

    return {
      requestId: `mock-${Date.now()}`,
      modelVersion: "mock",
      summary: prolonged
        ? "Patient provided detailed symptom context with moderate urgency indicators."
        : "Patient provided concise visit context; no severe immediate concern inferred.",
      riskFlags: prolonged ? ["Persistent symptom mention", "Follow-up recommended"] : ["Routine review"],
      confidence,
      recommendedFollowUp: prolonged
        ? "Flag for provider review before consultation and confirm symptom timeline."
        : "Share summary with provider and proceed with standard pre-visit workflow.",
      targets: [],
      aggregate: {
        overallRisk: prolonged ? "medium" : "low",
        strongestSignalTarget: "any_mod_plus",
        caveats: ["Mock adapter in use"]
      },
      quality: {
        observedAcousticCount: 0,
        imputedAcousticCount: 0,
        observedMetaCount: 0,
        imputedMetaCount: 0,
        confidenceModifier: 0
      }
    };
  }
}

export class ApiModelAnalysisAdapter implements AnalysisAdapter {
  async analyze(input: AudioAnalysisInput): Promise<AudioAnalysisResult> {
    const response = await fetch("/api/model/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      const message = details?.error ? String(details.error) : "Model analysis request failed";
      throw new Error(message);
    }

    return (await response.json()) as AudioAnalysisResult;
  }
}

// Placeholder for future direct in-browser model implementation.
export class ModelAnalysisAdapter implements AnalysisAdapter {
  async analyze(input: AudioAnalysisInput): Promise<AudioAnalysisResult> {
    void input;
    throw new Error("Model adapter is not connected yet. Add your model implementation here.");
  }
}
