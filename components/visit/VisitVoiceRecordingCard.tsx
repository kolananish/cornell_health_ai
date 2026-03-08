"use client";

import { AlertCircle, Dot, Mic, MicOff, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { audioBlobToWav } from "@/lib/audio/wav";
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

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.max(0, seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${min}:${sec}`;
}

export function VisitVoiceRecordingCard() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const clipsRef = useRef<Partial<Record<VoiceTask, ClipWithUrl>>>({});

  const [step, setStep] = useState<"form" | "submitted">("form");
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
      : status === "error"
        ? "Attention needed"
        : "Ready";

  const startRecording = async (task: VoiceTask) => {
    setError("");

    if (status === "recording") {
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
          setError("Failed to convert recording to WAV.");
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

  const submit = () => {
    setError("");

    if (status === "recording") {
      setError("Please stop the active recording before submitting.");
      return;
    }

    if (!optedIn) {
      setError("Please check the opt-in box before submitting your recordings.");
      return;
    }

    if (!clips.rainbow || !clips.free_speech) {
      setError("Please record both tasks before submitting.");
      return;
    }

    setStep("submitted");
  };

  if (step === "submitted") {
    return (
      <section className="rounded-2xl border border-[#d5dced] bg-white p-6 shadow-[0_12px_28px_rgba(34,47,89,0.08)]">
        <p className="text-center text-[18px] font-semibold text-[#334188]">Thank you for your submission!</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#d5dced] bg-white p-4 shadow-[0_12px_28px_rgba(34,47,89,0.08)]">
      <p className="text-[13px] leading-[1.45] text-[#3c4464]">
        Your physician is recommending you complete this vocal analysis as a pre-screening for your visit. If you would like to
        opt-in, please hit the checkmark and record your audio.
      </p>
      <label className="mt-3 inline-flex items-center gap-2 text-[13px] font-medium text-[#313957]">
        <input type="checkbox" checked={optedIn} onChange={(event) => setOptedIn(event.target.checked)} />
        I opt in to complete this vocal analysis.
      </label>

      <div className="mt-3 rounded-xl border border-[#dfe4f3] bg-[#f5f7ff] px-3 py-2 text-[12px] text-[#50597a]">
        <p className="font-semibold text-[#36406a]">Setup (both tasks)</p>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          <li>Quiet room, no background noise</li>
          <li>Microphone ~30 cm (12 inches) from your mouth</li>
          <li>Wait 1 second after pressing Record before speaking</li>
          <li>Normal speaking volume - not too loud, not too quiet</li>
        </ul>
      </div>

      <div className="mt-3 inline-flex items-center rounded-full bg-[#eef2ff] px-3 py-1 text-[12px] font-semibold text-[#4b5582]">
        <Dot size={18} className={status === "recording" ? "animate-pulse text-red-500" : "text-[#8f99bb]"} />
        {statusLabel}
        {status === "recording" ? ` | ${formatDuration(elapsedSeconds)}` : ""}
      </div>

      <div className="mt-3 space-y-3">
        {taskConfigs.map((task) => {
          const clip = clips[task.id];
          const isActive = activeTask === task.id;

          return (
            <article key={task.id} className="rounded-xl border border-[#e1e7f5] bg-[#fafcff] p-3">
              <p className="text-[14px] font-semibold text-[#2f3757]">{task.title}</p>
              <p className="mt-1 text-[12px] leading-[1.4] text-[#505a7d]">&ldquo;{task.script}&rdquo;</p>
              <p className="mt-1 text-[12px] leading-[1.4] text-[#505a7d]">{task.instructions}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => startRecording(task.id)} disabled={status === "recording"}>
                  {clip ? <RotateCcw size={14} className="mr-1.5" /> : <Mic size={14} className="mr-1.5" />}
                  {clip ? "Retry" : "Record"}
                </Button>
                {isActive ? (
                  <Button variant="secondary" size="sm" onClick={stopRecording}>
                    <MicOff size={14} className="mr-1.5" />
                    Stop
                  </Button>
                ) : null}
                {clip ? <span className="text-[11px] font-semibold text-[#646f96]">Saved | {formatDuration(clip.durationSeconds)}</span> : null}
              </div>

              {clip ? (
                <audio controls className="mt-2 h-8 w-full">
                  <source src={clip.url} type={clip.mimeType} />
                </audio>
              ) : null}
            </article>
          );
        })}
      </div>

      {error ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#f4c7ca] bg-[#fff4f4] px-2.5 py-2 text-[12px] text-[#a8343c]">
          <AlertCircle size={14} />
          {error}
        </div>
      ) : null}

      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={submit} disabled={!optedIn || !allRequiredTasksReady || status === "recording"}>
          Submit
        </Button>
      </div>
    </section>
  );
}
