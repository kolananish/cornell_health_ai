import type { AudioAnalysisInput, AudioAnalysisResult } from "@/lib/types";

function shortHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0").slice(0, 8);
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatTerminalAnalysis(input: AudioAnalysisInput, result: AudioAnalysisResult): string {
  const lines: string[] = [];
  lines.push("[MODEL] -----------------------------------------------");
  lines.push(`[MODEL] requestId=${result.requestId} modelVersion=${result.modelVersion}`);
  lines.push(`[MODEL] recordingId=${input.recordingId} duration=${input.durationSeconds}s sampleRate=${input.sampleRateHz}Hz`);
  lines.push(
    `[MODEL] quality acoustic observed=${result.quality.observedAcousticCount} imputed=${result.quality.imputedAcousticCount} | meta observed=${result.quality.observedMetaCount} imputed=${result.quality.imputedMetaCount}`
  );

  if (input.transcript) {
    lines.push(`[MODEL] transcript length=${input.transcript.length} hash=${shortHash(input.transcript)}`);
  }

  for (const target of result.targets) {
    lines.push(
      `[MODEL] target=${target.name} prob=${pct(target.probability)} threshold=${target.threshold.toFixed(3)} margin=${target.margin.toFixed(3)} risk=${target.riskLevel}`
    );

    const pos = target.topPositiveContributors
      .slice(0, 3)
      .map((item) => `${item.feature}:${item.contribution.toFixed(3)}`)
      .join(", ");

    const neg = target.topNegativeContributors
      .slice(0, 3)
      .map((item) => `${item.feature}:${item.contribution.toFixed(3)}`)
      .join(", ");

    lines.push(`[MODEL]   top+ ${pos || "n/a"}`);
    lines.push(`[MODEL]   top- ${neg || "n/a"}`);
  }

  lines.push(
    `[MODEL] aggregate overallRisk=${result.aggregate.overallRisk} strongest=${result.aggregate.strongestSignalTarget} confidence=${pct(result.confidence)}`
  );
  if (result.aggregate.caveats.length > 0) {
    lines.push(`[MODEL] caveats=${result.aggregate.caveats.join(" | ")}`);
  }
  lines.push("[MODEL] ------------------------------------------------");

  return lines.join("\n");
}
