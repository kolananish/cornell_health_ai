import Link from "next/link";
import { WorkflowShell } from "@/components/layout/WorkflowShell";

export default function ReviewPage() {
  return (
    <WorkflowShell>
      <section className="mx-auto w-full max-w-[700px] rounded-2xl border border-[#d7d8e0] bg-white p-8 shadow-card">
        <h1 className="title-serif text-[40px] font-bold text-[#3f327d]">Step 3 placeholder</h1>
        <p className="mt-3 text-[16px] text-[#4b4d58]">
          This final submission and provider-facing handoff step is intentionally left lightweight for your future staff
          and patient login split.
        </p>
        <div className="mt-6">
          <Link
            href="/medical-history"
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#5a49e8] px-6 text-sm font-semibold text-white transition hover:bg-[#4b3bdd]"
          >
            Return to intake
          </Link>
        </div>
      </section>
    </WorkflowShell>
  );
}
