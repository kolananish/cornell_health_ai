import Link from "next/link";
import { WorkflowShell } from "@/components/layout/WorkflowShell";

export default function ReviewPage() {
  return (
    <WorkflowShell>
      <section className="mx-auto w-full max-w-[980px]">
        <div className="rounded-[30px] border border-[#d9deee] bg-[linear-gradient(145deg,#f9fbff_0%,#f2f6ff_100%)] p-6 shadow-[0_14px_28px_rgba(31,44,84,0.08)] md:p-10">
          <article className="mx-auto max-w-[700px] rounded-2xl border border-[#d7dcef] bg-white p-8 text-center md:p-10">
            <p className="inline-flex rounded-full border border-[#d9def2] bg-[#f5f7ff] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#5b67a0]">
              Intake complete
            </p>
            <h1 className="title-serif mt-4 text-[42px] font-bold leading-[1.08] text-[#334188] md:text-[48px]">Submission received</h1>
            <p className="mx-auto mt-4 max-w-[520px] text-[18px] leading-[1.55] text-[#4b4d58]">
              Thank you for submitting your profile. The doctor is almost ready to see you.
            </p>
            <div className="mt-7">
              <Link
                href="/visit"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#5a49e8] px-8 text-sm font-semibold text-white transition hover:bg-[#4b3bdd]"
              >
                Start Visit
              </Link>
            </div>
          </article>
        </div>
      </section>
    </WorkflowShell>
  );
}
