"use client";

import { useRouter } from "next/navigation";
import { WorkflowShell } from "@/components/layout/WorkflowShell";
import { Button } from "@/components/ui/button";

type DemoRole = "provider" | "patient";

export default function Home() {
  const router = useRouter();

  const login = (role: DemoRole) => {
    window.sessionStorage.setItem(
      "demo-auth",
      JSON.stringify({
        role,
        timestamp: new Date().toISOString()
      })
    );

    router.push(role === "patient" ? "/medical-history" : "/provider");
  };

  return (
    <WorkflowShell>
      <section className="mx-auto w-full max-w-[1120px]">
        <div className="relative overflow-hidden rounded-[34px] border border-[#dbe1ef] bg-[linear-gradient(145deg,#f8fbff_0%,#f3f7ff_52%,#eef9fb_100%)] px-6 py-10 shadow-[0_16px_40px_rgba(32,43,77,0.08)] md:px-10 md:py-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#8a93f4]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-[#1ea7c2]/12 blur-3xl" />

          <div className="relative grid gap-8 md:grid-cols-[1.25fr_1fr] md:items-center">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#42549f]">Teladoc Health Intake</p>
              <h1 className="title-serif mt-3 max-w-[560px] text-[42px] font-bold leading-[1.06] text-[#2a3676] md:text-[58px]">
                Start your care journey
              </h1>
              <p className="mt-4 max-w-[560px] text-[17px] leading-[1.6] text-[#46527f]">
                Choose your role to continue into the demo workflow. The experience is designed to be quick, clear, and easy to
                follow.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#d6dcf1] bg-white/75 px-3 py-1 text-[12px] font-semibold text-[#4a578a]">
                  Guided intake
                </span>
                <span className="rounded-full border border-[#d6dcf1] bg-white/75 px-3 py-1 text-[12px] font-semibold text-[#4a578a]">
                  Voice screening
                </span>
                <span className="rounded-full border border-[#d6dcf1] bg-white/75 px-3 py-1 text-[12px] font-semibold text-[#4a578a]">
                  Provider handoff
                </span>
              </div>
            </div>

            <article className="rounded-3xl border border-[#d8def0] bg-white/90 p-6 text-[#1e2440] shadow-[0_14px_30px_rgba(22,35,74,0.12)] backdrop-blur">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#5f69a6]">Continue</p>
              <p className="mt-1 text-[22px] font-semibold text-[#273055]">Select login type</p>
              <p className="mt-2 text-[14px] leading-[1.45] text-[#57608a]">Pick one option to proceed.</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button className="h-12 w-full rounded-full" size="lg" onClick={() => login("provider")}>
                  Provider
                </Button>
                <Button className="h-12 w-full rounded-full" size="lg" variant="secondary" onClick={() => login("patient")}>
                  Patient
                </Button>
              </div>
            </article>
          </div>
        </div>
      </section>
    </WorkflowShell>
  );
}
