"use client";

import { Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { WorkflowShell } from "@/components/layout/WorkflowShell";
import { Button } from "@/components/ui/button";
import { demoPatientProfile } from "@/lib/demo-profile";

type TabKey = "health" | "demographics";

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="field-label text-[13px]">{label}</p>
      <div className="rounded-xl border border-[#d9dae2] bg-[#fafbff] px-3 py-2 text-[14px] text-[#2f3138]">{value}</div>
    </div>
  );
}

export function MedicalHistoryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("demographics");

  const fullName = `${demoPatientProfile.firstName} ${demoPatientProfile.lastName}`;

  return (
    <WorkflowShell>
      <section className="mx-auto w-full max-w-[700px]">
        <h1 className="title-serif text-[44px] font-bold leading-[1.08] text-[#3f327d]">{fullName}&apos;s medical history</h1>
        <p className="mt-4 text-[16px] leading-[1.45] text-[#3d3f47]">
          This demo uses one hardcoded patient profile so your care team sees a consistent intake summary.
        </p>

        <button
          type="button"
          onClick={() => window.print()}
          className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-[#5a49e8]"
        >
          <Printer size={16} />
          Print medical history
        </button>

        <div className="mt-8 border-b border-[#d9dae2]">
          <button
            type="button"
            onClick={() => setActiveTab("demographics")}
            className={`mr-8 border-b-[3px] pb-2 text-[16px] font-semibold ${
              activeTab === "demographics" ? "border-[#5a49e8] text-[#2f3138]" : "border-transparent text-[#61636f]"
            }`}
          >
            Demographics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("health")}
            className={`border-b-[3px] pb-2 text-[16px] font-semibold ${
              activeTab === "health" ? "border-[#5a49e8] text-[#2f3138]" : "border-transparent text-[#61636f]"
            }`}
          >
            Health Content
          </button>
        </div>

        {activeTab === "health" ? (
          <div className="mt-6 space-y-5">
            <section className="rounded-2xl border border-[#d9dae2] bg-white p-4 shadow-card">
              <p className="text-[14px] font-semibold text-[#30323a]">Current conditions</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {demoPatientProfile.health.currentConditions.map((condition) => (
                  <span key={condition} className="rounded-full border border-[#d2d4dd] bg-[#f5f5fa] px-3 py-1 text-[12px]">
                    {condition}
                  </span>
                ))}
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border border-[#d9dae2] bg-white p-4 shadow-card">
                <p className="text-[14px] font-semibold text-[#30323a]">Medications</p>
                <div className="mt-2 space-y-2">
                  {demoPatientProfile.health.medications.map((medication) => (
                    <p key={medication.name} className="text-[14px] text-[#3a3c44]">
                      {medication.name} | {medication.dosage} | {medication.frequency}
                    </p>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-[#d9dae2] bg-white p-4 shadow-card">
                <p className="text-[14px] font-semibold text-[#30323a]">Allergies</p>
                <div className="mt-2 space-y-2">
                  {demoPatientProfile.health.allergies.map((allergy) => (
                    <p key={allergy.allergen} className="text-[14px] text-[#3a3c44]">
                      {allergy.allergen} | {allergy.reaction} | {allergy.severity}
                    </p>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ReadOnlyRow label="Past diagnoses" value={demoPatientProfile.health.pastDiagnoses} />
              <ReadOnlyRow label="Surgeries / procedures" value={demoPatientProfile.health.procedures} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ReadOnlyRow label="Tobacco use" value={demoPatientProfile.health.tobaccoUse} />
              <ReadOnlyRow label="Alcohol use" value={demoPatientProfile.health.alcoholUse} />
              <ReadOnlyRow label="Exercise frequency" value={demoPatientProfile.health.exerciseFrequency} />
              <ReadOnlyRow label="Average sleep (hours)" value={demoPatientProfile.health.avgSleepHours} />
            </div>

            <ReadOnlyRow label="Symptoms / concerns" value={demoPatientProfile.health.symptomsConcerns} />
            <ReadOnlyRow label="Family history" value={demoPatientProfile.health.familyHistory} />
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <section className="rounded-2xl border border-[#d9dae2] bg-white p-4 shadow-card">
              <p className="text-[14px] font-semibold text-[#30323a]">Personal information</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <ReadOnlyRow label="First name" value={demoPatientProfile.firstName} />
                <ReadOnlyRow label="Last name" value={demoPatientProfile.lastName} />
                <ReadOnlyRow label="Date of birth" value={demoPatientProfile.demographics.dateOfBirth} />
                <ReadOnlyRow label="Age" value={String(demoPatientProfile.demographics.age)} />
                <ReadOnlyRow label="Sex" value={demoPatientProfile.demographics.sex} />
                <ReadOnlyRow label="Gender identity" value={demoPatientProfile.demographics.genderIdentity} />
                <ReadOnlyRow label="Education" value={demoPatientProfile.demographics.education} />
                <ReadOnlyRow label="Preferred language" value={demoPatientProfile.demographics.preferredLanguage} />
                <ReadOnlyRow label="Race" value={demoPatientProfile.demographics.race} />
                <ReadOnlyRow label="Ethnicity" value={demoPatientProfile.demographics.ethnicity} />
              </div>
            </section>

            <section className="rounded-2xl border border-[#d9dae2] bg-white p-4 shadow-card">
              <p className="text-[14px] font-semibold text-[#30323a]">Contact details</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <ReadOnlyRow label="Phone" value={demoPatientProfile.demographics.phone} />
                <ReadOnlyRow label="Email" value={demoPatientProfile.demographics.email} />
                <ReadOnlyRow label="Address line 1" value={demoPatientProfile.demographics.address1} />
                <ReadOnlyRow label="Address line 2" value={demoPatientProfile.demographics.address2} />
                <ReadOnlyRow label="City" value={demoPatientProfile.demographics.city} />
                <ReadOnlyRow label="State" value={demoPatientProfile.demographics.state} />
                <ReadOnlyRow label="ZIP" value={demoPatientProfile.demographics.zip} />
              </div>
            </section>

            <section className="rounded-2xl border border-[#d9dae2] bg-white p-4 shadow-card">
              <p className="text-[14px] font-semibold text-[#30323a]">Emergency contact & insurance</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <ReadOnlyRow label="Emergency contact" value={demoPatientProfile.demographics.emergencyName} />
                <ReadOnlyRow label="Relationship" value={demoPatientProfile.demographics.emergencyRelationship} />
                <ReadOnlyRow label="Emergency phone" value={demoPatientProfile.demographics.emergencyPhone} />
                <ReadOnlyRow label="Insurance plan" value={demoPatientProfile.demographics.insurancePlan} />
                <ReadOnlyRow label="Member ID" value={demoPatientProfile.demographics.memberId} />
                <ReadOnlyRow label="Group number" value={demoPatientProfile.demographics.groupNumber} />
              </div>
            </section>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <Button size="lg" onClick={() => router.push("/voice-recording")}>
            Next
          </Button>
        </div>
      </section>
    </WorkflowShell>
  );
}
