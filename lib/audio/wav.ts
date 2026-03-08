"use client";

function interleaveChannels(buffer: AudioBuffer): Float32Array {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;

  if (channels === 1) {
    return buffer.getChannelData(0).slice();
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

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return buffer;
}

export async function audioBlobToWav(blob: Blob): Promise<{ wavBlob: Blob; sampleRate: number; durationSeconds: number }> {
  const context = new AudioContext();

  try {
    const bytes = await blob.arrayBuffer();
    const decoded = await context.decodeAudioData(bytes.slice(0));
    const mono = interleaveChannels(decoded);
    const wavBuffer = encodeWav(mono, decoded.sampleRate);

    return {
      wavBlob: new Blob([wavBuffer], { type: "audio/wav" }),
      sampleRate: decoded.sampleRate,
      durationSeconds: decoded.duration
    };
  } finally {
    await context.close();
  }
}
