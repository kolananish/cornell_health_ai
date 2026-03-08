"use client";

import {
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Video,
  VideoOff
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { VisitVoiceRecordingCard } from "@/components/visit/VisitVoiceRecordingCard";

export default function VisitPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser does not support camera streaming.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
    } catch {
      setCameraError("Camera permission was denied. Please allow access and try again.");
      setIsCameraOn(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOn(false);
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
      return;
    }

    void startCamera();
  };

  return (
    <div className="min-h-screen bg-[#eff2f8]">
      <AppHeader />

      <main className="px-4 py-5 md:px-6 md:py-6">
        <div className="mx-auto grid w-full max-w-[1720px] gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-3xl border border-[#d9deec] bg-white p-4 shadow-[0_18px_45px_rgba(22,34,74,0.12)] md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="title-serif text-[36px] font-bold leading-[1.08] text-[#334188]">Virtual Visit</h1>
                <p className="mt-1 text-[14px] text-[#5f6680]">You are in the waiting room. Your provider will join shortly.</p>
              </div>
              <span className="rounded-full border border-[#d9def2] bg-[#f4f7ff] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#5f6aa5]">
                Waiting Room
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <article className="relative overflow-hidden rounded-2xl border border-[#d8deef] bg-[linear-gradient(145deg,#243067_0%,#1f2b56_46%,#173f63_100%)] p-4 text-white">
                <div className="flex h-[470px] items-center justify-center rounded-xl border border-white/20 bg-white/5">
                  <div className="text-center">
                    <p className="text-[18px] font-semibold">Provider Video Feed</p>
                    <p className="mt-2 text-[13px] text-[#d8dff9]">Your provider will appear here when the visit starts.</p>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 h-[150px] w-[230px] overflow-hidden rounded-xl border border-[#cdd4ec] bg-[#0f1118] shadow-lg">
                  {isCameraOn ? (
                    <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[12px] text-[#d2d7e9]">Camera preview off</div>
                  )}
                </div>
              </article>

              <aside className="rounded-2xl border border-[#d9deec] bg-[#f8faff] p-4">
                <h2 className="text-[18px] font-semibold text-[#2f375f]">Visit Details</h2>
                <div className="mt-3 space-y-2 text-[13px] text-[#4f5776]">
                  <p>
                    <span className="font-semibold text-[#2e3452]">Provider:</span> Assigned clinician
                  </p>
                  <p>
                    <span className="font-semibold text-[#2e3452]">Visit type:</span> Express wellness follow-up
                  </p>
                  <p>
                    <span className="font-semibold text-[#2e3452]">Connection:</span> Secure video
                  </p>
                </div>

                {cameraError ? (
                  <p className="mt-3 rounded-lg border border-[#f4c7ca] bg-[#fff4f4] px-3 py-2 text-[12px] text-[#a8343c]">{cameraError}</p>
                ) : null}
              </aside>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsMicOn((prev) => !prev)}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition ${
                  isMicOn ? "bg-[#ece9ff] text-[#4b3bdd]" : "bg-[#ffe8ec] text-[#b43545]"
                }`}
              >
                {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
                {isMicOn ? "Mic On" : "Mic Off"}
              </button>

              <button
                type="button"
                onClick={toggleCamera}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition ${
                  isCameraOn ? "bg-[#ece9ff] text-[#4b3bdd]" : "bg-[#ffe8ec] text-[#b43545]"
                }`}
              >
                {isCameraOn ? <Video size={16} /> : <VideoOff size={16} />}
                {isCameraOn ? "Camera On" : "Turn Camera On"}
              </button>

              <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#eff2fb] px-5 text-sm font-semibold text-[#4e5775]">
                <Users size={16} />
                Participants
              </button>

              <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#eff2fb] px-5 text-sm font-semibold text-[#4e5775]">
                <MessageSquare size={16} />
                Chat
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  router.push("/review");
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#d94545] px-5 text-sm font-semibold text-white"
              >
                <PhoneOff size={16} />
                End
              </button>
            </div>
          </section>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <VisitVoiceRecordingCard />
          </aside>
        </div>
      </main>
    </div>
  );
}
