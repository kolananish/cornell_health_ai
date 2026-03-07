"use client";

import modelArtifact from "@/lib/ml/model-artifact.v2.json";
import type { FeatureMap } from "@/lib/types";

export type ExtractedAcousticFeatures = {
  sampleRateHz: number;
  durationSeconds: number;
  acousticFeatures: FeatureMap;
  observedCount: number;
};

type MeydaLike = {
  sampleRate: number;
  bufferSize: number;
  melBands: number;
  numberOfMFCCCoefficients: number;
  extract: (feature: string | string[], signal: Float32Array) => unknown;
};

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function std(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * (sorted.length - 1))));
  return sorted[idx];
}

function safeDb(amplitude: number): number {
  return 20 * Math.log10(Math.max(amplitude, 1e-9));
}

function rms(frame: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < frame.length; i += 1) {
    sum += frame[i] * frame[i];
  }
  return Math.sqrt(sum / frame.length);
}

function zeroCrossingRate(frame: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < frame.length; i += 1) {
    if ((frame[i - 1] >= 0 && frame[i] < 0) || (frame[i - 1] < 0 && frame[i] >= 0)) {
      crossings += 1;
    }
  }
  return crossings / frame.length;
}

function estimatePitchHz(frame: Float32Array, sampleRate: number): number | null {
  const minLag = Math.floor(sampleRate / 400);
  const maxLag = Math.floor(sampleRate / 70);

  let bestLag = -1;
  let bestCorr = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let corr = 0;
    for (let i = 0; i < frame.length - lag; i += 1) {
      corr += frame[i] * frame[i + lag];
    }

    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  if (bestLag <= 0 || bestCorr <= 0) return null;
  const pitch = sampleRate / bestLag;
  if (!Number.isFinite(pitch) || pitch < 70 || pitch > 400) return null;
  return pitch;
}

function flattenToMono(buffer: AudioBuffer): Float32Array {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;

  if (channels === 1) {
    return buffer.getChannelData(0);
  }

  const mono = new Float32Array(length);
  for (let c = 0; c < channels; c += 1) {
    const channel = buffer.getChannelData(c);
    for (let i = 0; i < length; i += 1) {
      mono[i] += channel[i] / channels;
    }
  }

  return mono;
}

export async function extractApproximateAcousticFeatures(blob: Blob): Promise<ExtractedAcousticFeatures> {
  const MeydaModule = await import("meyda");
  const Meyda = (MeydaModule.default ?? MeydaModule) as unknown as MeydaLike;

  const baseFeatures = Object.fromEntries(modelArtifact.acoustic_cols.map((name) => [name, null])) as FeatureMap;

  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const signal = flattenToMono(audioBuffer);
    const sampleRate = audioBuffer.sampleRate;
    const durationSeconds = Math.max(audioBuffer.duration, 0.001);

    const frameSize = 1024;
    const hopSize = 512;
    Meyda.sampleRate = sampleRate;
    Meyda.bufferSize = frameSize;
    Meyda.melBands = 26;
    Meyda.numberOfMFCCCoefficients = 13;

    const frames: Float32Array[] = [];
    const rmsValues: number[] = [];
    const zcrValues: number[] = [];
    const intensityDbValues: number[] = [];
    const centroidValues: number[] = [];
    const skewnessValues: number[] = [];
    const kurtosisValues: number[] = [];
    const slopeValues: number[] = [];

    const mfccBins = [[], [], [], []] as number[][];
    const pitchValues: number[] = [];

    for (let start = 0; start + frameSize <= signal.length; start += hopSize) {
      const frame = signal.slice(start, start + frameSize);
      frames.push(frame);

      const frameRms = rms(frame);
      rmsValues.push(frameRms);
      zcrValues.push(zeroCrossingRate(frame));
      intensityDbValues.push(safeDb(frameRms));

      const pitch = estimatePitchHz(frame, sampleRate);
      if (pitch !== null) {
        pitchValues.push(pitch);
      }

      const extracted = Meyda.extract(["mfcc", "spectralCentroid", "spectralSkewness", "spectralKurtosis", "spectralSlope"], frame) as {
        mfcc?: number[];
        spectralCentroid?: number;
        spectralSkewness?: number;
        spectralKurtosis?: number;
        spectralSlope?: number;
      };

      if (Array.isArray(extracted?.mfcc) && extracted.mfcc.length >= 4) {
        mfccBins[0].push(extracted.mfcc[0]);
        mfccBins[1].push(extracted.mfcc[1]);
        mfccBins[2].push(extracted.mfcc[2]);
        mfccBins[3].push(extracted.mfcc[3]);
      }

      if (typeof extracted?.spectralCentroid === "number") centroidValues.push(extracted.spectralCentroid);
      if (typeof extracted?.spectralSkewness === "number") skewnessValues.push(extracted.spectralSkewness);
      if (typeof extracted?.spectralKurtosis === "number") kurtosisValues.push(extracted.spectralKurtosis);
      if (typeof extracted?.spectralSlope === "number") slopeValues.push(extracted.spectralSlope);
    }

    const meanRms = mean(rmsValues);
    const vadThreshold = Math.max(0.006, meanRms * 0.55);

    let voicedFrameCount = 0;
    let voicedEnergy = 0;
    let unvoicedEnergy = 0;

    const voicedSegments: number[] = [];
    const unvoicedSegments: number[] = [];
    let currentSegmentFrames = 0;
    let inVoiced = false;

    for (let i = 0; i < frames.length; i += 1) {
      const value = rmsValues[i] ?? 0;
      const voiced = value > vadThreshold;

      if (voiced) {
        voicedFrameCount += 1;
        voicedEnergy += value * value;
      } else {
        unvoicedEnergy += value * value;
      }

      if (i === 0) {
        inVoiced = voiced;
        currentSegmentFrames = 1;
      } else if (voiced === inVoiced) {
        currentSegmentFrames += 1;
      } else {
        const segmentSeconds = (currentSegmentFrames * hopSize) / sampleRate;
        if (inVoiced) voicedSegments.push(segmentSeconds);
        else unvoicedSegments.push(segmentSeconds);

        currentSegmentFrames = 1;
        inVoiced = voiced;
      }
    }

    if (currentSegmentFrames > 0) {
      const segmentSeconds = (currentSegmentFrames * hopSize) / sampleRate;
      if (inVoiced) voicedSegments.push(segmentSeconds);
      else unvoicedSegments.push(segmentSeconds);
    }

    const voicedSegmentsPerSec = voicedSegments.length / durationSeconds;
    const pauseRate = unvoicedSegments.length / durationSeconds;
    const phonationRatio = voicedFrameCount / Math.max(frames.length, 1);

    const hnrDb = 10 * Math.log10((voicedEnergy + 1e-9) / (unvoicedEnergy + 1e-9));

    const meanPitch = mean(pitchValues);
    const stdPitch = std(pitchValues);
    const f0Semitone = pitchValues.map((hz) => 12 * Math.log2(Math.max(hz, 1e-6) / 27.5));

    const meanIntensity = mean(intensityDbValues);
    const stdIntensity = std(intensityDbValues);

    const loudnessStdNorm = Math.abs(meanIntensity) > 1e-6 ? stdIntensity / Math.abs(meanIntensity) : 0;

    const speakingRate = voicedSegmentsPerSec * 1.9;
    const articulationRate = speakingRate * Math.max(phonationRatio, 0.4);

    const localJitter = meanPitch > 0 ? stdPitch / meanPitch : 0;
    const localShimmer = meanRms > 0 ? std(rmsValues) / meanRms : 0;

    const mapped: FeatureMap = {
      ...baseFeatures,
      "F0semitoneFrom27.5Hz_sma3nz_amean": mean(f0Semitone),
      "F0semitoneFrom27.5Hz_sma3nz_pctlrange0-2": percentile(f0Semitone, 98) - percentile(f0Semitone, 2),
      "F0semitoneFrom27.5Hz_sma3nz_stddevNorm":
        Math.abs(mean(f0Semitone)) > 1e-6 ? std(f0Semitone) / Math.abs(mean(f0Semitone)) : 0,
      F1frequency_sma3nz_amean: mean(centroidValues) / 100,
      HNRdBACF_sma3nz_amean: hnrDb,
      MeanUnvoicedSegmentLength: mean(unvoicedSegments),
      MeanVoicedSegmentLengthSec: mean(voicedSegments),
      VoicedSegmentsPerSec: voicedSegmentsPerSec,
      articulation_rate: articulationRate,
      cepstral_peak_prominence_mean: mean(mfccBins[0]),
      cepstral_peak_prominence_std: std(mfccBins[0]),
      jitterLocal_sma3nz_amean: localJitter,
      localDB_shimmer: safeDb(localShimmer + 1e-6),
      local_jitter: localJitter,
      local_shimmer: localShimmer,
      loudness_sma3_amean: meanIntensity,
      "loudness_sma3_pctlrange0-2": percentile(intensityDbValues, 98) - percentile(intensityDbValues, 2),
      loudness_sma3_stddevNorm: loudnessStdNorm,
      mean_f0_hertz: meanPitch,
      mean_hnr_db: hnrDb,
      mean_intensity_db: meanIntensity,
      mean_pause_duration: mean(unvoicedSegments),
      mfcc1_sma3_amean: mean(mfccBins[0]),
      mfcc1_sma3_stddevNorm: Math.abs(mean(mfccBins[0])) > 1e-6 ? std(mfccBins[0]) / Math.abs(mean(mfccBins[0])) : 0,
      mfcc2_sma3_amean: mean(mfccBins[1]),
      mfcc2_sma3_stddevNorm: Math.abs(mean(mfccBins[1])) > 1e-6 ? std(mfccBins[1]) / Math.abs(mean(mfccBins[1])) : 0,
      mfcc3_sma3_amean: mean(mfccBins[2]),
      mfcc3_sma3_stddevNorm: Math.abs(mean(mfccBins[2])) > 1e-6 ? std(mfccBins[2]) / Math.abs(mean(mfccBins[2])) : 0,
      mfcc4_sma3_amean: mean(mfccBins[3]),
      mfcc4_sma3_stddevNorm: Math.abs(mean(mfccBins[3])) > 1e-6 ? std(mfccBins[3]) / Math.abs(mean(mfccBins[3])) : 0,
      pause_rate: pauseRate,
      phonation_ratio: phonationRatio,
      rap_jitter: localJitter,
      shimmerLocaldB_sma3nz_amean: safeDb(localShimmer + 1e-6),
      "slopeUV500-1500_sma3nz_amean": mean(slopeValues),
      "slopeV0-500_sma3nz_amean": mean(slopeValues) * 0.8,
      speaking_rate: speakingRate,
      spectral_gravity: mean(centroidValues),
      spectral_kurtosis: mean(kurtosisValues),
      spectral_skewness: mean(skewnessValues),
      spectral_slope: mean(slopeValues),
      spectral_tilt: -mean(slopeValues),
      std_f0_hertz: stdPitch,
      std_hnr_db: std(rmsValues),
      std_intensity_db: stdIntensity
    };

    let observedCount = 0;
    for (const key of modelArtifact.acoustic_cols) {
      const value = mapped[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        observedCount += 1;
      } else {
        mapped[key] = null;
      }
    }

    return {
      sampleRateHz: sampleRate,
      durationSeconds,
      acousticFeatures: mapped,
      observedCount
    };
  } finally {
    await audioContext.close();
  }
}
