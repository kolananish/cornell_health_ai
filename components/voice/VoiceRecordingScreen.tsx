"use client";

import { AlertCircle, Dot, Mic, MicOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WorkflowShell } from "@/components/layout/WorkflowShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiModelAnalysisAdapter } from "@/lib/ml/analysis-adapter";
import { extractApproximateAcousticFeatures } from "@/lib/ml/audio-feature-extractor";
import modelArtifact from "@/lib/ml/model-artifact.v2.json";
import { getRecordings, saveRecording } from "@/lib/storage/indexeddb";
import type { AudioAnalysisResult, FeatureMap, RecordingItem, RecordingStatus, RiskLevel } from "@/lib/types";

type RecordingWithUrl = RecordingItem & {
  url: string;
};

type MetaInput = {
  age_num: number;
  is_female: boolean;
  edu_num: number;
  sr_depression: boolean;
  sr_gad: boolean;
  sr_ptsd: boolean;
  sr_insomnia: boolean;
  sr_bipolar: boolean;
  sr_panic: boolean;
  sr_soc_anx_dis: boolean;
  sr_ocd: boolean;
};

const analysisAdapter = new ApiModelAnalysisAdapter();

const defaultMetaInput: MetaInput = {
  age_num: 31,
  is_female: false,
  edu_num: 3,
  sr_depression: false,
  sr_gad: false,
  sr_ptsd: false,
  sr_insomnia: false,
  sr_bipolar: false,
  sr_panic: false,
  sr_soc_anx_dis: false,
  sr_ocd: false
};

function emptyAcousticFeatures(): FeatureMap {
  return Object.fromEntries(modelArtifact.acoustic_cols.map((key) => [key, null]));
}

function toMetaFeatures(metaInput: MetaInput): FeatureMap {
  const anyPsych =
    metaInput.sr_depression ||
    metaInput.sr_gad ||
    metaInput.sr_ptsd ||
    metaInput.sr_insomnia ||
    metaInput.sr_bipolar ||
    metaInput.sr_panic ||
    metaInput.sr_soc_anx_dis ||
    metaInput.sr_ocd;

  return {
    age_num: metaInput.age_num,
    is_female: metaInput.is_female ? 1 : 0,
    edu_num: metaInput.edu_num,
    sr_depression: metaInput.sr_depression ? 1 : 0,
    sr_gad: metaInput.sr_gad ? 1 : 0,
    sr_ptsd: metaInput.sr_ptsd ? 1 : 0,
    sr_insomnia: metaInput.sr_insomnia ? 1 : 0,
    sr_bipolar: metaInput.sr_bipolar ? 1 : 0,
    sr_panic: metaInput.sr_panic ? 1 : 0,
    sr_soc_anx_dis: metaInput.sr_soc_anx_dis ? 1 : 0,
    sr_ocd: metaInput.sr_ocd ? 1 : 0,
    any_psych_sr: anyPsych ? 1 : 0
  };
}

function riskBadgeClass(risk: RiskLevel): string {
  if (risk === "high") return "bg-[#ffe7ea] text-[#ae2936]";
  if (risk === "medium") return "bg-[#fff4dd] text-[#975f00]";
  return "bg-[#e8f8ef] text-[#1d7a46]";
}

export function VoiceRecordingScreen() {
  const router = useRouter();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const [status, setStatus] = useState<RecordingStatus>("ready");
  const [error, setError] = useState<string>("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [contextNote, setContextNote] = useState("");
  const [metaInput, setMetaInput] = useState<MetaInput>(defaultMetaInput);
  const [recordings, setRecordings] = useState<RecordingWithUrl[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, AudioAnalysisResult>>({});

  useEffect(() => {
    const hydrate = async () => {
      try {
        const stored = await getRecordings();
        const withUrls = stored.map((recording) => ({
          ...recording,
          url: URL.createObjectURL(recording.blob)
        }));
        objectUrlsRef.current = withUrls.map((recording) => recording.url);
        setRecordings(withUrls);
      } catch {
        setError("Unable to load previous recordings in this browser.");
      }
    };

    hydrate();

    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      stopMediaStream();
      clearTimer();
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopMediaStream = () => {
    if (!streamRef.current) return;
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    setError("");

    if (!("mediaDevices" in navigator) || !("MediaRecorder" in window)) {
      setStatus("error");
      setError("This browser does not support microphone recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      setElapsedSeconds(0);
      setStatus("recording");

      timerRef.current = window.setInterval(() => {
        if (!startedAtRef.current) return;
        const seconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsedSeconds(seconds);
      }, 1000);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        clearTimer();
        setStatus("processing");

        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const durationSeconds = startedAtRef.current ? Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000)) : 1;

        const recording: RecordingItem = {
          id: `rec-${Date.now()}`,
          createdAt: new Date().toISOString(),
          durationSeconds,
          blob,
          mimeType
        };

        try {
          await saveRecording(recording);
          const url = URL.createObjectURL(blob);
          objectUrlsRef.current.unshift(url);
          const withUrl = { ...recording, url };
          setRecordings((prev) => [withUrl, ...prev]);

          let extracted = {
            sampleRateHz: 16000,
            durationSeconds,
            acousticFeatures: emptyAcousticFeatures()
          };

          try {
            const computed = await extractApproximateAcousticFeatures(blob);
            extracted = {
              sampleRateHz: computed.sampleRateHz,
              durationSeconds: Math.max(durationSeconds, Math.floor(computed.durationSeconds)),
              acousticFeatures: computed.acousticFeatures
            };
          } catch {
            // Use imputer-friendly null values if extraction fails.
          }

          const analysis = await analysisAdapter.analyze({
            recordingId: recording.id,
            durationSeconds: extracted.durationSeconds,
            sampleRateHz: extracted.sampleRateHz,
            acousticFeatures: extracted.acousticFeatures,
            metaFeatures: toMetaFeatures(metaInput),
            transcript: contextNote
          });

          setAnalyses((prev) => ({ ...prev, [recording.id]: analysis }));
          setStatus("stopped");
          setElapsedSeconds(durationSeconds);
        } catch (analysisError) {
          setStatus("error");
          setError(analysisError instanceof Error ? analysisError.message : "Recording saved, but model analysis failed.");
        } finally {
          startedAtRef.current = null;
          chunksRef.current = [];
          stopMediaStream();
        }
      };

      recorder.start();
    } catch {
      setStatus("error");
      setError("Microphone permission was denied. Please allow access and try again.");
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recorder.stop();
  };

  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  const statusLabel =
    status === "recording"
      ? "Recording"
      : status === "processing"
        ? "Analyzing"
        : status === "stopped"
          ? "Saved + analyzed"
          : status === "error"
            ? "Attention needed"
            : "Ready to record";

  const setMetaBoolean = (key: keyof MetaInput, value: boolean) => {
    setMetaInput((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <WorkflowShell>
      <section className="mx-auto w-full max-w-[780px]">
        <h1 className="title-serif text-[48px] font-bold leading-[1.08] text-[#3f327d]">Voice recording</h1>
        <p className="mt-3 max-w-[850px] text-[16px] leading-[1.45] text-[#3d3f47]">
          Use the microphone below to share any additional context with your care team. This is optional but can help
          your provider prepare for your visit.
        </p>

        <p className="mt-5 text-[14px] font-semibold text-[#656775]">Step 2 of 3</p>

        <div className="mt-5 rounded-2xl border border-[#d7d8e0] bg-white p-6 shadow-card">
          <h2 className="title-serif text-[38px] font-bold text-[#3f327d]">Voice Recording</h2>
          <p className="mt-2 text-[16px] leading-[1.45] text-[#4c4e5a]">
            Describe your symptoms, concerns, or anything else you&apos;d like your care team to know. Detailed output is
            logged to the terminal for reviewer visibility.
          </p>

          <div className="mt-5 inline-flex items-center rounded-full bg-[#f2f2f8] px-4 py-2 text-[14px] font-semibold text-[#626476]">
            <Dot size={24} className={status === "recording" ? "animate-pulse text-red-500" : "text-[#8f90a0]"} />
            {statusLabel}
            {status === "recording" ? ` • ${formatDuration(elapsedSeconds)}` : ""}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button size="lg" onClick={startRecording} disabled={status === "recording" || status === "processing"}>
              <Mic className="mr-2" size={16} />
              Start recording
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={stopRecording}
              disabled={status !== "recording"}
              className="bg-[#ece9ff] text-[#4b3bdd]"
            >
              <MicOff className="mr-2" size={16} />
              Stop recording
            </Button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <p className="field-label">Age</p>
              <Input
                type="number"
                min={16}
                max={95}
                value={metaInput.age_num}
                onChange={(event) => setMetaInput((prev) => ({ ...prev, age_num: Number(event.target.value) || 0 }))}
              />
            </div>
            <div>
              <p className="field-label">Education level (1-5)</p>
              <Input
                type="number"
                min={1}
                max={5}
                value={metaInput.edu_num}
                onChange={(event) => setMetaInput((prev) => ({ ...prev, edu_num: Number(event.target.value) || 0 }))}
              />
            </div>
            <label className="inline-flex items-center gap-2 text-[14px] text-[#373944]">
              <input
                type="checkbox"
                checked={metaInput.is_female}
                onChange={(event) => setMetaBoolean("is_female", event.target.checked)}
              />
              Female (binary field used by this model version)
            </label>
          </div>

          <div className="mt-4">
            <p className="field-label">Self-reported mental health history used by model</p>
            <div className="grid gap-2 md:grid-cols-2">
              {[
                ["sr_depression", "Depression"],
                ["sr_gad", "Generalized anxiety"],
                ["sr_ptsd", "PTSD"],
                ["sr_insomnia", "Insomnia"],
                ["sr_bipolar", "Bipolar"],
                ["sr_panic", "Panic disorder"],
                ["sr_soc_anx_dis", "Social anxiety"],
                ["sr_ocd", "OCD"]
              ].map(([key, label]) => (
                <label key={key} className="inline-flex items-center gap-2 text-[14px] text-[#373944]">
                  <input
                    type="checkbox"
                    checked={metaInput[key as keyof MetaInput] as boolean}
                    onChange={(event) => setMetaBoolean(key as keyof MetaInput, event.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="field-label">Optional context notes</p>
            <Textarea
              value={contextNote}
              onChange={(event) => setContextNote(event.target.value)}
              placeholder="Example: chest tightness after climbing stairs, started 2 weeks ago"
              className="min-h-[92px]"
            />
          </div>

          {error ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#f2c5c7] bg-[#fff4f4] px-3 py-2 text-[14px] text-[#9e3136]">
              <AlertCircle size={16} />
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-5 space-y-3">
          {recordings.map((recording) => {
            const analysis = analyses[recording.id];
            return (
              <article key={recording.id} className="rounded-xl border border-[#d7d8e0] bg-white p-4 shadow-card">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[15px] font-semibold text-[#343640]">
                    Recording from {new Date(recording.createdAt).toLocaleString()} ({formatDuration(recording.durationSeconds)})
                  </p>
                  <span className="rounded-full bg-[#ece9ff] px-3 py-1 text-[12px] font-semibold text-[#4b3bdd]">Stored locally</span>
                </div>
                <audio controls className="w-full">
                  <source src={recording.url} type={recording.mimeType} />
                </audio>

                {analysis ? (
                  <div className="mt-3 rounded-lg border border-[#e2e3ea] bg-[#fafaff] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-[#4b3bdd]">Model summary</p>
                      <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${riskBadgeClass(analysis.aggregate.overallRisk)}`}>
                        {analysis.aggregate.overallRisk.toUpperCase()} RISK
                      </span>
                    </div>
                    <p className="mt-1 text-[14px] text-[#3d3f47]">{analysis.summary}</p>
                    <p className="mt-1 text-[13px] text-[#5a5c67]">Confidence: {(analysis.confidence * 100).toFixed(1)}%</p>

                    <div className="mt-2 space-y-1">
                      {analysis.targets.map((target) => (
                        <p key={target.name} className="text-[13px] text-[#444654]">
                          {target.name}: {(target.probability * 100).toFixed(1)}% ({target.riskLevel})
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button variant="secondary" size="lg" onClick={() => router.push("/medical-history")}>
            Back
          </Button>
          <Button size="lg" onClick={() => router.push("/review")}>Next</Button>
        </div>
      </section>
    </WorkflowShell>
  );
}
