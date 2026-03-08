import type { AnalysisAdapter, VoiceAnalysisInput, VoiceAnalysisResult } from "@/lib/types";

function metadataToPayload(metadata: VoiceAnalysisInput["metadata"]): Record<string, number> {
  const anyPsych =
    metadata.sr_depression ||
    metadata.sr_gad ||
    metadata.sr_ptsd ||
    metadata.sr_insomnia ||
    metadata.sr_bipolar ||
    metadata.sr_panic ||
    metadata.sr_soc_anx_dis ||
    metadata.sr_ocd;

  return {
    age_num: metadata.age_num,
    is_female: metadata.is_female ? 1 : 0,
    edu_num: metadata.edu_num,
    sr_depression: metadata.sr_depression ? 1 : 0,
    sr_gad: metadata.sr_gad ? 1 : 0,
    sr_ptsd: metadata.sr_ptsd ? 1 : 0,
    sr_insomnia: metadata.sr_insomnia ? 1 : 0,
    sr_bipolar: metadata.sr_bipolar ? 1 : 0,
    sr_panic: metadata.sr_panic ? 1 : 0,
    sr_soc_anx_dis: metadata.sr_soc_anx_dis ? 1 : 0,
    sr_ocd: metadata.sr_ocd ? 1 : 0,
    any_psych_sr: anyPsych ? 1 : 0
  };
}

export class ApiModelAnalysisAdapter implements AnalysisAdapter {
  async analyze(input: VoiceAnalysisInput): Promise<VoiceAnalysisResult> {
    const formData = new FormData();

    formData.append("rainbow_audio", input.rainbowClip.blob, `rainbow.${input.rainbowClip.mimeType.includes("wav") ? "wav" : "bin"}`);
    formData.append(
      "free_speech_audio",
      input.freeSpeechClip.blob,
      `free-speech.${input.freeSpeechClip.mimeType.includes("wav") ? "wav" : "bin"}`
    );

    formData.append(
      "metadata",
      JSON.stringify({
        ...metadataToPayload(input.metadata),
        threshold_mode: input.thresholdMode ?? "balanced",
        transcript: input.transcript ?? ""
      })
    );

    const response = await fetch("/api/model/analyze", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      const message = details?.error ? String(details.error) : "Model analysis request failed";
      throw new Error(message);
    }

    return (await response.json()) as VoiceAnalysisResult;
  }
}
