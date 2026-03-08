import type { VoiceAnalysisResult } from "@/lib/types";

export const VOICE_RISK_SCREENING_STORAGE_KEY = "voice-risk-screening:v1";

export type StoredVoiceRiskScreening = VoiceAnalysisResult & {
  saved_at: string;
};

export function saveVoiceRiskScreening(result: VoiceAnalysisResult): void {
  if (typeof window === "undefined") return;

  const payload: StoredVoiceRiskScreening = {
    ...result,
    saved_at: new Date().toISOString()
  };

  window.localStorage.setItem(VOICE_RISK_SCREENING_STORAGE_KEY, JSON.stringify(payload));
}

export function readVoiceRiskScreening(): StoredVoiceRiskScreening | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(VOICE_RISK_SCREENING_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredVoiceRiskScreening;
  } catch {
    return null;
  }
}

export function clearVoiceRiskScreening(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(VOICE_RISK_SCREENING_STORAGE_KEY);
}
