from __future__ import annotations

import io
import math
from typing import Iterable

import librosa
import numpy as np


def _safe_mean(values: Iterable[float]) -> float:
    arr = np.asarray(list(values), dtype=float)
    arr = arr[np.isfinite(arr)]
    if arr.size == 0:
        return float("nan")
    return float(np.mean(arr))


def _safe_std(values: Iterable[float]) -> float:
    arr = np.asarray(list(values), dtype=float)
    arr = arr[np.isfinite(arr)]
    if arr.size < 2:
        return float("nan")
    return float(np.std(arr))


def _safe_percentile(values: Iterable[float], p: float) -> float:
    arr = np.asarray(list(values), dtype=float)
    arr = arr[np.isfinite(arr)]
    if arr.size == 0:
        return float("nan")
    return float(np.percentile(arr, p))


def _std_norm(values: Iterable[float]) -> float:
    m = _safe_mean(values)
    s = _safe_std(values)
    if not np.isfinite(m) or not np.isfinite(s) or abs(m) < 1e-8:
        return float("nan")
    return float(s / abs(m))


def _segments_from_mask(mask: np.ndarray, hop_length: int, sr: int) -> tuple[list[float], list[float]]:
    voiced_segments: list[float] = []
    unvoiced_segments: list[float] = []

    if mask.size == 0:
        return voiced_segments, unvoiced_segments

    current = bool(mask[0])
    start = 0

    for i in range(1, mask.size):
        if bool(mask[i]) != current:
            length = (i - start) * hop_length / sr
            if current:
                voiced_segments.append(length)
            else:
                unvoiced_segments.append(length)
            start = i
            current = bool(mask[i])

    length = (mask.size - start) * hop_length / sr
    if current:
        voiced_segments.append(length)
    else:
        unvoiced_segments.append(length)

    return voiced_segments, unvoiced_segments


def _spectral_slope_from_stft(stft_mag: np.ndarray, freqs: np.ndarray) -> np.ndarray:
    slopes = []
    x = freqs.astype(float)
    x_mean = np.mean(x)
    x_var = np.sum((x - x_mean) ** 2) + 1e-9

    for i in range(stft_mag.shape[1]):
        y = np.log10(np.maximum(stft_mag[:, i], 1e-12))
        y_mean = np.mean(y)
        cov = np.sum((x - x_mean) * (y - y_mean))
        slopes.append(cov / x_var)

    return np.asarray(slopes, dtype=float)


def _band_slope(freqs: np.ndarray, spectrum: np.ndarray, low_hz: float, high_hz: float) -> float:
    idx = np.where((freqs >= low_hz) & (freqs <= high_hz))[0]
    if idx.size < 5:
        return float("nan")

    x = freqs[idx]
    y = np.log10(np.maximum(spectrum[idx], 1e-12))
    x_mean = np.mean(x)
    x_var = np.sum((x - x_mean) ** 2) + 1e-9
    y_mean = np.mean(y)
    cov = np.sum((x - x_mean) * (y - y_mean))
    return float(cov / x_var)


def _extract_formants(y: np.ndarray, sr: int) -> tuple[float, float, float, float, float]:
    frame_length = 2048
    hop_length = 512
    formant_candidates: list[tuple[float, float, float]] = []

    for start in range(0, max(1, len(y) - frame_length), hop_length * 3):
        frame = y[start : start + frame_length]
        if frame.size < frame_length:
            continue
        if np.sqrt(np.mean(frame**2)) < 1e-3:
            continue

        try:
            a = librosa.lpc(frame, order=12)
            roots = np.roots(a)
            roots = roots[np.imag(roots) >= 0]
            angles = np.arctan2(np.imag(roots), np.real(roots))
            freqs = np.sort(angles * (sr / (2 * np.pi)))
            freqs = freqs[(freqs > 90) & (freqs < 5000)]
            if freqs.size >= 3:
                formant_candidates.append((float(freqs[0]), float(freqs[1]), float(freqs[2])))
        except Exception:
            continue

    if not formant_candidates:
        nan = float("nan")
        return nan, nan, nan, nan, nan

    f1 = np.asarray([f[0] for f in formant_candidates], dtype=float)
    f2 = np.asarray([f[1] for f in formant_candidates], dtype=float)
    f3 = np.asarray([f[2] for f in formant_candidates], dtype=float)

    return (
        float(np.mean(f1)),
        float(np.std(f1)) if f1.size > 1 else float("nan"),
        float(np.mean(f2)),
        float(np.std(f2)) if f2.size > 1 else float("nan"),
        float(np.mean(f3)),
    )


def load_audio_for_analysis(audio_bytes: bytes, target_sr: int = 16000) -> tuple[np.ndarray, int]:
    signal, sr = librosa.load(io.BytesIO(audio_bytes), sr=target_sr, mono=True)
    if signal.size == 0:
        raise ValueError("Empty audio payload")
    return signal.astype(np.float32), sr


def extract_features(signal: np.ndarray, sr: int, acoustic_cols: list[str]) -> dict[str, float]:
    duration = max(len(signal) / sr, 1e-3)
    features = {name: float("nan") for name in acoustic_cols}

    frame_length = 2048
    hop_length = 512

    rms = librosa.feature.rms(y=signal, frame_length=frame_length, hop_length=hop_length)[0]
    intensity_db = librosa.amplitude_to_db(np.maximum(rms, 1e-8), ref=1.0)

    vad_threshold = max(0.006, float(np.nanmean(rms)) * 0.55)
    voiced_mask = rms > vad_threshold

    voiced_segments, unvoiced_segments = _segments_from_mask(voiced_mask.astype(int), hop_length, sr)
    voiced_ratio = float(np.mean(voiced_mask)) if voiced_mask.size else float("nan")

    onset_env = librosa.onset.onset_strength(y=signal, sr=sr, hop_length=hop_length)
    onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, hop_length=hop_length, backtrack=False)
    speaking_rate = float(len(onset_frames) / duration)
    articulation_rate = speaking_rate / voiced_ratio if np.isfinite(voiced_ratio) and voiced_ratio > 1e-4 else float("nan")

    f0, _, _ = librosa.pyin(
        signal,
        sr=sr,
        fmin=librosa.note_to_hz("C2"),
        fmax=librosa.note_to_hz("G5"),
        frame_length=frame_length,
        hop_length=hop_length,
    )
    f0 = np.asarray(f0, dtype=float)
    f0 = f0[np.isfinite(f0)]
    f0_semitone = 12 * np.log2(np.maximum(f0, 1e-6) / 27.5) if f0.size else np.asarray([], dtype=float)

    harmonic = librosa.effects.harmonic(signal)
    residual = signal - harmonic
    h_var = float(np.var(harmonic)) + 1e-9
    r_var = float(np.var(residual)) + 1e-9
    hnr_db = float(10 * np.log10(h_var / r_var))

    stft = np.abs(librosa.stft(signal, n_fft=2048, hop_length=hop_length))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)

    centroid = librosa.feature.spectral_centroid(S=stft, sr=sr)[0]
    bandwidth = librosa.feature.spectral_bandwidth(S=stft, sr=sr)[0]
    rolloff = librosa.feature.spectral_rolloff(S=stft, sr=sr)[0]
    flatness = librosa.feature.spectral_flatness(S=stft)[0]

    slopes = _spectral_slope_from_stft(stft, freqs)

    mfcc = librosa.feature.mfcc(y=signal, sr=sr, n_mfcc=4, hop_length=hop_length)
    mfcc1, mfcc2, mfcc3, mfcc4 = [mfcc[i, :] if mfcc.shape[0] > i else np.asarray([], dtype=float) for i in range(4)]

    f1_mean, f1_std, f2_mean, f2_std, f3_mean = _extract_formants(signal, sr)

    long_spec = np.mean(stft, axis=1) if stft.size else np.asarray([], dtype=float)
    alpha_low = np.mean(long_spec[(freqs >= 50) & (freqs < 1000)]) if long_spec.size else float("nan")
    alpha_high = np.mean(long_spec[(freqs >= 1000) & (freqs < 5000)]) if long_spec.size else float("nan")
    alpha_ratio = float(np.log10((alpha_low + 1e-9) / (alpha_high + 1e-9))) if np.isfinite(alpha_low) and np.isfinite(alpha_high) else float("nan")

    hammar_low = np.max(long_spec[(freqs >= 0) & (freqs < 2000)]) if long_spec.size else float("nan")
    hammar_high = np.max(long_spec[(freqs >= 2000) & (freqs < 5000)]) if long_spec.size else float("nan")
    hammarberg = float(np.log10((hammar_low + 1e-9) / (hammar_high + 1e-9))) if np.isfinite(hammar_low) and np.isfinite(hammar_high) else float("nan")

    slope_v = _band_slope(freqs, long_spec, 0, 500) if long_spec.size else float("nan")
    slope_uv = _band_slope(freqs, long_spec, 500, 1500) if long_spec.size else float("nan")

    jitter_local = float(np.mean(np.abs(np.diff(f0)) / np.maximum(f0[:-1], 1e-6))) if f0.size > 1 else float("nan")
    rap_jitter = jitter_local

    amp = rms[np.isfinite(rms)]
    local_shimmer = float(np.mean(np.abs(np.diff(amp)) / np.maximum(amp[:-1], 1e-6))) if amp.size > 1 else float("nan")
    local_shimmer_db = float(20 * np.log10(max(local_shimmer, 1e-8))) if np.isfinite(local_shimmer) else float("nan")

    pause_rate = float(len(unvoiced_segments) / duration)
    voiced_segments_per_sec = float(len(voiced_segments) / duration)

    features.update(
        {
            "speaking_rate": speaking_rate,
            "articulation_rate": articulation_rate,
            "phonation_ratio": voiced_ratio,
            "pause_rate": pause_rate,
            "mean_pause_duration": _safe_mean(unvoiced_segments),
            "mean_f0_hertz": _safe_mean(f0),
            "std_f0_hertz": _safe_std(f0),
            "mean_intensity_db": _safe_mean(intensity_db),
            "std_intensity_db": _safe_std(intensity_db),
            "loudness_sma3_amean": _safe_mean(intensity_db),
            "loudness_sma3_stddevNorm": _std_norm(intensity_db),
            "loudness_sma3_pctlrange0-2": _safe_percentile(intensity_db, 98) - _safe_percentile(intensity_db, 2),
            "F0semitoneFrom27.5Hz_sma3nz_amean": _safe_mean(f0_semitone),
            "F0semitoneFrom27.5Hz_sma3nz_stddevNorm": _std_norm(f0_semitone),
            "F0semitoneFrom27.5Hz_sma3nz_pctlrange0-2": _safe_percentile(f0_semitone, 98) - _safe_percentile(f0_semitone, 2),
            "VoicedSegmentsPerSec": voiced_segments_per_sec,
            "MeanVoicedSegmentLengthSec": _safe_mean(voiced_segments),
            "MeanUnvoicedSegmentLength": _safe_mean(unvoiced_segments),
            "mean_hnr_db": hnr_db,
            "std_hnr_db": _safe_std(rms),
            "local_jitter": jitter_local,
            "rap_jitter": rap_jitter,
            "local_shimmer": local_shimmer,
            "localDB_shimmer": local_shimmer_db,
            "cepstral_peak_prominence_mean": _safe_mean(mfcc1),
            "cepstral_peak_prominence_std": _safe_std(mfcc1),
            "jitterLocal_sma3nz_amean": jitter_local,
            "shimmerLocaldB_sma3nz_amean": local_shimmer_db,
            "HNRdBACF_sma3nz_amean": hnr_db,
            "mfcc1_sma3_amean": _safe_mean(mfcc1),
            "mfcc2_sma3_amean": _safe_mean(mfcc2),
            "mfcc3_sma3_amean": _safe_mean(mfcc3),
            "mfcc4_sma3_amean": _safe_mean(mfcc4),
            "mfcc1_sma3_stddevNorm": _std_norm(mfcc1),
            "mfcc2_sma3_stddevNorm": _std_norm(mfcc2),
            "mfcc3_sma3_stddevNorm": _std_norm(mfcc3),
            "mfcc4_sma3_stddevNorm": _std_norm(mfcc4),
            "spectral_skewness": _safe_mean((bandwidth - centroid) / np.maximum(centroid, 1e-6)),
            "spectral_kurtosis": _safe_mean((rolloff - centroid) / np.maximum(np.abs(bandwidth), 1e-6)),
            "spectral_slope": _safe_mean(slopes),
            "spectral_tilt": -_safe_mean(slopes),
            "spectral_gravity": _safe_mean(centroid),
            "alphaRatioV_sma3nz_amean": alpha_ratio,
            "hammarbergIndexV_sma3nz_amean": hammarberg,
            "slopeV0-500_sma3nz_amean": slope_v,
            "slopeUV500-1500_sma3nz_amean": slope_uv,
            "mean_f1_loc": f1_mean,
            "std_f1_loc": f1_std,
            "mean_f2_loc": f2_mean,
            "std_f2_loc": f2_std,
            "F1frequency_sma3nz_amean": f1_mean,
            "F2frequency_sma3nz_amean": f2_mean,
            "F3frequency_sma3nz_amean": f3_mean,
            "F1amplitudeLogRelF0_sma3nz_amean": float("nan"),
            "F2amplitudeLogRelF0_sma3nz_amean": float("nan"),
        }
    )

    # Alias names used by some training variants.
    features.setdefault("std_intensity_db", features.get("std_intensity_db", float("nan")))
    features.setdefault("mean_hnr_db", hnr_db)

    # Replace infinities with NaN to align with model imputers.
    for key, value in list(features.items()):
        if not np.isfinite(value):
            features[key] = float("nan")

    return features


def median_aggregate_features(feature_maps: list[dict[str, float]], acoustic_cols: list[str]) -> dict[str, float]:
    aggregated: dict[str, float] = {}

    for feature in acoustic_cols:
        vals = np.asarray([fm.get(feature, float("nan")) for fm in feature_maps], dtype=float)
        vals = vals[np.isfinite(vals)]
        if vals.size == 0:
            aggregated[feature] = float("nan")
        else:
            aggregated[feature] = float(np.median(vals))

    return aggregated
