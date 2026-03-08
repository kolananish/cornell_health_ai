"use client";

import { AlertCircle, Dot, Mic, MicOff, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { WorkflowShell } from "@/components/layout/WorkflowShell";
import { Button } from "@/components/ui/button";
import { audioBlobToWav } from "@/lib/audio/wav";
import { demoModelMetadata } from "@/lib/demo-profile";
import { ApiModelAnalysisAdapter } from "@/lib/ml/analysis-adapter";
import { saveVoiceRiskScreening } from "@/lib/ml/browser-storage";
import type { RecordingStatus, VoiceClip, VoiceTask } from "@/lib/types";

type TaskConfig = {
  id: VoiceTask;
  title: string;
  script: string;
  instructions: string;
};

type ClipWithUrl = VoiceClip & {
  url: string;
  createdAt: string;
};

const taskConfigs: TaskConfig[] = [
  {
    id: "rainbow",
    title: "Task 1 - Rainbow Passage",
    script:
      "When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow. The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon.",
    instructions: "Read this passage aloud, twice in a row, at your normal speaking pace."
  },
  {
    id: "free_speech",
    title: "Task 2 - Counting Task",
    script: "Count from 1 to 20 out loud, at your normal speaking pace.",
    instructions:
      "Speak each number clearly. Brief pauses between numbers are fine. Do not rush or slow down intentionally."
  }
];

const analysisAdapter = new ApiModelAnalysisAdapter();

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.max(0, seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${min}:${sec}`;
}

export function VoiceRecordingScreen() {
  const router = useRouter();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const clipsRef = useRef<Partial<Record<VoiceTask, ClipWithUrl>>>({});

  const [status, setStatus] = useState<RecordingStatus>("ready");
  const [activeTask, setActiveTask] = useState<VoiceTask | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [clips, setClips] = useState<Partial<Record<VoiceTask, ClipWithUrl>>>({});
  const [optedIn, setOptedIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    clipsRef.current = clips;
  }, [clips]);

  useEffect(() => {
    return () => {
      Object.values(clipsRef.current).forEach((clip) => {
        if (clip) {
          URL.revokeObjectURL(clip.url);
        }
      });

      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const allRequiredTasksReady = useMemo(() => Boolean(clips.rainbow && clips.free_speech), [clips]);

  const statusLabel =
    status === "recording"
      ? `Recording ${activeTask ? `(${activeTask === "rainbow" ? "Rainbow Passage" : "Counting Task"})` : ""}`
      : status === "processing"
        ? "Submitting"
        : status === "error"
          ? "Attention needed"
          : "Ready";

  const startRecording = async (task: VoiceTask) => {
    setError("");

    if (status === "recording" || status === "processing") {
      setError("A recording is already in progress.");
      return;
    }

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
      setActiveTask(task);
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
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }

        const rawMimeType = recorder.mimeType || "audio/webm";
        const rawBlob = new Blob(chunksRef.current, { type: rawMimeType });
        const clipDurationSeconds = startedAtRef.current ? Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000)) : 1;

        try {
          const converted = await audioBlobToWav(rawBlob);
          const wavDuration = Math.max(1, Math.floor(converted.durationSeconds));
          const url = URL.createObjectURL(converted.wavBlob);

          setClips((prev) => {
            const previous = prev[task];
            if (previous) {
              URL.revokeObjectURL(previous.url);
            }

            return {
              ...prev,
              [task]: {
                blob: converted.wavBlob,
                durationSeconds: Math.max(clipDurationSeconds, wavDuration),
                mimeType: "audio/wav",
                url,
                createdAt: new Date().toISOString()
              }
            };
          });

          setStatus("ready");
        } catch {
          setStatus("error");
          setError("Failed to convert recording to WAV for model processing.");
        } finally {
          startedAtRef.current = null;
          chunksRef.current = [];
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          setActiveTask(null);
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

  const submitForAnalysis = async () => {
    setError("");

    if (!optedIn) {
      setError("Please check the opt-in box before submitting your recordings.");
      return;
    }

    if (!clips.rainbow || !clips.free_speech) {
      setError("Please record both tasks before submitting.");
      return;
    }

    setStatus("processing");
    const payload = {
      rainbowClip: clips.rainbow,
      freeSpeechClip: clips.free_speech,
      metadata: demoModelMetadata
    };

    void analysisAdapter
      .analyze(payload)
      .then((result) => {
        saveVoiceRiskScreening(result);
      })
      .catch((analysisError) => {
        console.error("[voice-analysis] background analysis failed", analysisError);
      });

    router.push("/review");
  };

  return (
    <WorkflowShell>
      <section className="mx-auto w-full max-w-[760px]">
        <div className="rounded-2xl border border-[#d7d8e0] bg-white p-6 shadow-card">
          <p className="text-[15px] leading-[1.5] text-[#3d3f47]">
            Your physician is recommending you complete this vocal analysis as a pre-screening for your visit. If you would like
            to opt-in, please hit the checkmark and record your audio.
          </p>
          <label className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-[#31333a]">
            <input type="checkbox" checked={optedIn} onChange={(event) => setOptedIn(event.target.checked)} />
            I opt in to complete this vocal analysis.
          </label>

          <div className="mt-5 rounded-xl bg-[#f3f4f9] px-4 py-3 text-[13px] text-[#535564]">
            <p className="font-semibold">Setup (both tasks)</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Quiet room, no background noise</li>
              <li>Microphone ~30 cm (12 inches) from your mouth</li>
              <li>Wait 1 second after pressing Record before speaking</li>
              <li>Normal speaking volume - not too loud, not too quiet</li>
            </ul>
          </div>

          <div className="mt-5 inline-flex items-center rounded-full bg-[#f2f2f8] px-4 py-2 text-[14px] font-semibold text-[#626476]">
            <Dot size={20} className={status === "recording" ? "animate-pulse text-red-500" : "text-[#8f90a0]"} />
            {statusLabel}
            {status === "recording" ? ` | ${formatDuration(elapsedSeconds)}` : ""}
          </div>

          <div className="mt-5 space-y-4">
            {taskConfigs.map((task) => {
              const clip = clips[task.id];
              const isActive = activeTask === task.id;

              return (
                <article key={task.id} className="rounded-xl border border-[#e1e2ea] bg-[#fafaff] p-4">
                  <p className="text-[16px] font-semibold text-[#333541]">{task.title}</p>
                  <p className="mt-2 text-[14px] leading-[1.5] text-[#4c4e5a]">&ldquo;{task.script}&rdquo;</p>
                  <p className="mt-2 text-[14px] leading-[1.5] text-[#4c4e5a]">{task.instructions}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={() => startRecording(task.id)} disabled={status === "recording" || status === "processing"}>
                      {clip ? <RotateCcw size={15} className="mr-2" /> : <Mic size={15} className="mr-2" />}
                      {clip ? "Retry recording" : "Record"}
                    </Button>
                    {isActive ? (
                      <Button variant="secondary" size="sm" onClick={stopRecording}>
                        <MicOff size={15} className="mr-2" />
                        Stop
                      </Button>
                    ) : null}
                    {clip ? <span className="text-[12px] font-semibold text-[#606271]">Saved | {formatDuration(clip.durationSeconds)}</span> : null}
                  </div>

                  {clip ? (
                    <audio controls className="mt-3 w-full">
                      <source src={clip.url} type={clip.mimeType} />
                    </audio>
                  ) : null}
                </article>
              );
            })}
          </div>

          {error ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#f2c5c7] bg-[#fff4f4] px-3 py-2 text-[14px] text-[#9e3136]">
              <AlertCircle size={16} />
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex justify-end">
            <Button size="lg" onClick={submitForAnalysis} disabled={!optedIn || !allRequiredTasksReady || status === "processing" || status === "recording"}>
              Submit
            </Button>
          </div>
        </div>
      </section>
    </WorkflowShell>
  );
}
