"use client";

import { Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { WorkflowShell } from "@/components/layout/WorkflowShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  alcoholOptions,
  availableConditions,
  exerciseOptions,
  initialDemographicsForm,
  initialHealthForm,
  members,
  states,
  tobaccoOptions
} from "@/lib/mock-data";
import type { Allergy, DemographicsFormData, HealthFormData, Medication } from "@/lib/types";

type TabKey = "health" | "demographics";

const biologicalSexOptions = ["Male", "Female", "Intersex", "Prefer not to say"];
const genderOptions = ["Man", "Woman", "Non-binary", "Prefer not to say"];
const raceOptions = ["Asian", "Black or African American", "White", "Native American", "Other"];
const ethnicityOptions = ["Not Hispanic or Latino", "Hispanic or Latino", "Prefer not to say"];
const languageOptions = ["English", "Spanish", "Mandarin", "French", "Other"];
const relationshipOptions = ["Spouse", "Parent", "Sibling", "Friend", "Other"];
const severityOptions: Array<Allergy["severity"]> = ["Low", "Moderate", "High"];

export function MedicalHistoryScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>("health");
  const [selectedMember, setSelectedMember] = useState(members[0]?.id ?? "");

  const [healthForm, setHealthForm] = useState<HealthFormData>(initialHealthForm);
  const [demographicsForm, setDemographicsForm] = useState<DemographicsFormData>(initialDemographicsForm);

  const [isMedicationModalOpen, setMedicationModalOpen] = useState(false);
  const [isAllergyModalOpen, setAllergyModalOpen] = useState(false);
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);

  const [newMedication, setNewMedication] = useState<Omit<Medication, "id">>({
    name: "",
    dosage: "",
    frequency: "",
    notes: ""
  });

  const [newAllergy, setNewAllergy] = useState<Omit<Allergy, "id">>({
    allergen: "",
    reaction: "",
    severity: "Moderate"
  });

  const selectedMemberName = useMemo(
    () => members.find((member) => member.id === selectedMember)?.name ?? members[0]?.name,
    [selectedMember]
  );

  const toggleCondition = (condition: string) => {
    setHealthForm((prev) => {
      const selected = prev.currentConditions.includes(condition);
      const currentConditions = selected
        ? prev.currentConditions.filter((item) => item !== condition)
        : [...prev.currentConditions, condition];

      return { ...prev, currentConditions };
    });
  };

  const addMedication = () => {
    if (!newMedication.name.trim()) return;

    const medication: Medication = {
      id: `med-${Date.now()}`,
      name: newMedication.name.trim(),
      dosage: newMedication.dosage.trim() || "Not specified",
      frequency: newMedication.frequency.trim() || "Not specified",
      notes: newMedication.notes?.trim()
    };

    setHealthForm((prev) => ({ ...prev, medications: [...prev.medications, medication] }));
    setNewMedication({ name: "", dosage: "", frequency: "", notes: "" });
    setMedicationModalOpen(false);
  };

  const addAllergy = () => {
    if (!newAllergy.allergen.trim()) return;

    const allergy: Allergy = {
      id: `allergy-${Date.now()}`,
      allergen: newAllergy.allergen.trim(),
      reaction: newAllergy.reaction.trim() || "Not specified",
      severity: newAllergy.severity
    };

    setHealthForm((prev) => ({ ...prev, allergies: [...prev.allergies, allergy] }));
    setNewAllergy({ allergen: "", reaction: "", severity: "Moderate" });
    setAllergyModalOpen(false);
  };

  const updateDemographics = <K extends keyof DemographicsFormData>(key: K, value: DemographicsFormData[K]) => {
    setDemographicsForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <WorkflowShell>
      <section className="mx-auto w-full max-w-[640px]">
        <h1 className="title-serif text-[48px] font-bold leading-[1.1] text-[#3f327d]">{selectedMemberName}&apos;s medical history</h1>
        <p className="mt-4 max-w-[560px] text-[16px] leading-[1.45] text-[#3d3f47]">
          A complete and accurate medical history helps your care team prepare safe, personalized treatment.
        </p>

        <button
          type="button"
          onClick={() => setPrintModalOpen(true)}
          className="mt-6 inline-flex items-center gap-2 text-[16px] font-semibold text-[#5a49e8]"
        >
          <Printer size={16} />
          View or Print Your Medical History.
        </button>

        <p className="mt-6 text-[14px] font-semibold text-[#393b44]">*Required</p>

        <div className="mt-6">
          <p className="mb-2 text-[15px] font-semibold text-[#2f3138]">Select a member</p>
          <Select
            value={selectedMember}
            onChange={setSelectedMember}
            options={members.map((member) => ({ label: member.name, value: member.id }))}
            className="text-[15px]"
          />
        </div>

        <div className="mt-8 border-b border-[#d9dae2]">
          <button
            type="button"
            onClick={() => setActiveTab("health")}
            className={`mr-8 border-b-[3px] pb-2 text-[16px] font-semibold ${
              activeTab === "health" ? "border-[#5a49e8] text-[#2f3138]" : "border-transparent text-[#61636f]"
            }`}
          >
            Health Content
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("demographics")}
            className={`border-b-[3px] pb-2 text-[16px] font-semibold ${
              activeTab === "demographics" ? "border-[#5a49e8] text-[#2f3138]" : "border-transparent text-[#61636f]"
            }`}
          >
            Demographics
          </button>
        </div>

        {activeTab === "health" ? (
          <div className="mt-5 space-y-5">
            <section>
              <p className="field-label text-[14px]">Current conditions</p>
              <div className="flex flex-wrap gap-2">
                {availableConditions.map((condition) => {
                  const active = healthForm.currentConditions.includes(condition);
                  return (
                    <button
                      key={condition}
                      type="button"
                      onClick={() => toggleCondition(condition)}
                      className={`rounded-full border px-4 py-1 text-[13px] transition ${
                        active
                          ? "border-[#8a7dff] bg-[#ece9ff] text-[#4b3bdd]"
                          : "border-[#d2d4dd] bg-white text-[#5b5d68] hover:border-[#8a7dff]"
                      }`}
                    >
                      {condition}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-xl border border-[#d9dae2] bg-white p-3 shadow-card">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-semibold">Medications</p>
                  <button className="text-[13px] font-semibold text-[#5a49e8]" onClick={() => setMedicationModalOpen(true)}>
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {healthForm.medications.map((medication) => (
                    <span key={medication.id} className="rounded-full border border-[#d2d4dd] bg-[#f5f5fa] px-3 py-1 text-[12px]">
                      {medication.name} {medication.dosage} {medication.frequency}
                    </span>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-[#d9dae2] bg-white p-3 shadow-card">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-semibold">Allergies</p>
                  <button className="text-[13px] font-semibold text-[#5a49e8]" onClick={() => setAllergyModalOpen(true)}>
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {healthForm.allergies.map((allergy) => (
                    <span key={allergy.id} className="rounded-full border border-[#d2d4dd] bg-[#f5f5fa] px-3 py-1 text-[12px]">
                      {allergy.allergen} - {allergy.reaction}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="field-label text-[13px]">Past diagnoses</p>
                <Textarea
                  value={healthForm.pastDiagnoses}
                  onChange={(event) => setHealthForm((prev) => ({ ...prev, pastDiagnoses: event.target.value }))}
                />
              </div>
              <div>
                <p className="field-label text-[13px]">Surgeries / procedures</p>
                <Textarea
                  value={healthForm.procedures}
                  onChange={(event) => setHealthForm((prev) => ({ ...prev, procedures: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="field-label text-[13px]">Tobacco use</p>
                <Select
                  value={healthForm.tobaccoUse}
                  onChange={(value) => setHealthForm((prev) => ({ ...prev, tobaccoUse: value }))}
                  options={tobaccoOptions.map((value) => ({ value, label: value }))}
                />
              </div>
              <div>
                <p className="field-label text-[13px]">Alcohol use</p>
                <Select
                  value={healthForm.alcoholUse}
                  onChange={(value) => setHealthForm((prev) => ({ ...prev, alcoholUse: value }))}
                  options={alcoholOptions.map((value) => ({ value, label: value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="field-label text-[13px]">Exercise frequency</p>
                <Select
                  value={healthForm.exerciseFrequency}
                  onChange={(value) => setHealthForm((prev) => ({ ...prev, exerciseFrequency: value }))}
                  options={exerciseOptions.map((value) => ({ value, label: value }))}
                />
              </div>
              <div>
                <p className="field-label text-[13px]">Avg sleep (hours)</p>
                <Input
                  value={healthForm.avgSleepHours}
                  onChange={(event) => setHealthForm((prev) => ({ ...prev, avgSleepHours: event.target.value }))}
                />
              </div>
            </div>

            <div>
              <p className="field-label text-[13px]">Symptoms / concerns</p>
              <Textarea
                value={healthForm.symptomsConcerns}
                onChange={(event) => setHealthForm((prev) => ({ ...prev, symptomsConcerns: event.target.value }))}
                className="min-h-[116px]"
              />
            </div>

            <div>
              <p className="field-label text-[13px]">Family history</p>
              <Textarea
                value={healthForm.familyHistory}
                onChange={(event) => setHealthForm((prev) => ({ ...prev, familyHistory: event.target.value }))}
              />
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <section>
              <p className="text-[14px] font-semibold text-[#30323a]">Personal information</p>
              <div className="mt-2 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="field-label">First name *</p>
                  <Input value={demographicsForm.firstName} onChange={(e) => updateDemographics("firstName", e.target.value)} />
                </div>
                <div>
                  <p className="field-label">Last name *</p>
                  <Input value={demographicsForm.lastName} onChange={(e) => updateDemographics("lastName", e.target.value)} />
                </div>
                <div>
                  <p className="field-label">Date of birth *</p>
                  <Input type="date" value={demographicsForm.dob} onChange={(e) => updateDemographics("dob", e.target.value)} />
                </div>
                <div>
                  <p className="field-label">Biological sex *</p>
                  <Select
                    value={demographicsForm.biologicalSex}
                    onChange={(value) => updateDemographics("biologicalSex", value)}
                    options={biologicalSexOptions.map((value) => ({ value, label: value }))}
                  />
                </div>
                <div>
                  <p className="field-label">Gender identity</p>
                  <Select
                    value={demographicsForm.genderIdentity}
                    onChange={(value) => updateDemographics("genderIdentity", value)}
                    options={genderOptions.map((value) => ({ value, label: value }))}
                  />
                </div>
              </div>
            </section>

            <section>
              <p className="text-[14px] font-semibold text-[#30323a]">Body measurements</p>
              <div className="mt-2 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="field-label">Height (ft)</p>
                  <Input value={demographicsForm.heightFeet} onChange={(e) => updateDemographics("heightFeet", e.target.value)} />
                </div>
                <div>
                  <p className="field-label">Height (in)</p>
                  <Input value={demographicsForm.heightInches} onChange={(e) => updateDemographics("heightInches", e.target.value)} />
                </div>
                <div>
                  <p className="field-label">Weight (lbs)</p>
                  <Input value={demographicsForm.weightLbs} onChange={(e) => updateDemographics("weightLbs", e.target.value)} />
                </div>
              </div>
            </section>

            <section>
              <p className="text-[14px] font-semibold text-[#30323a]">Race & ethnicity</p>
              <div className="mt-2 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="field-label">Race</p>
                  <Select
                    value={demographicsForm.race}
                    onChange={(value) => updateDemographics("race", value)}
                    options={raceOptions.map((value) => ({ value, label: value }))}
                  />
                </div>
                <div>
                  <p className="field-label">Ethnicity</p>
                  <Select
                    value={demographicsForm.ethnicity}
                    onChange={(value) => updateDemographics("ethnicity", value)}
                    options={ethnicityOptions.map((value) => ({ value, label: value }))}
                  />
                </div>
                <div>
                  <p className="field-label">Preferred language</p>
                  <Select
                    value={demographicsForm.preferredLanguage}
                    onChange={(value) => updateDemographics("preferredLanguage", value)}
                    options={languageOptions.map((value) => ({ value, label: value }))}
                  />
                </div>
              </div>
            </section>

            <section>
              <p className="text-[14px] font-semibold text-[#30323a]">Contact details</p>
              <div className="mt-2 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="field-label">Phone number</p>
                  <Input value={demographicsForm.phone} onChange={(e) => updateDemographics("phone", e.target.value)} />
                </div>
                <div>
                  <p className="field-label">Email address</p>
                  <Input value={demographicsForm.email} onChange={(e) => updateDemographics("email", e.target.value)} />
                </div>
              </div>
            </section>

            <section>
              <p className="text-[14px] font-semibold text-[#30323a]">Home address</p>
              <div className="mt-2 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <p className="field-label">Address line 1</p>
                  <Input value={demographicsForm.address1} onChange={(e) => updateDemographics("address1", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <p className="field-label">Address line 2</p>
                  <Input value={demographicsForm.address2} onChange={(e) => updateDemographics("address2", e.target.value)} />
                </div>
                <div>
                  <p className="field-label">City</p>
                  <Input value={demographicsForm.city} onChange={(e) => updateDemographics("city", e.target.value)} />
                </div>
                <div>
                  <p className="field-label">State</p>
                  <Select
                    value={demographicsForm.state}
                    onChange={(value) => updateDemographics("state", value)}
                    options={states.map((value) => ({ value, label: value }))}
                  />
                </div>
                <div>
                  <p className="field-label">ZIP code</p>
                  <Input value={demographicsForm.zip} onChange={(e) => updateDemographics("zip", e.target.value)} />
                </div>
              </div>
            </section>

            <section>
              <p className="text-[14px] font-semibold text-[#30323a]">Emergency contact</p>
              <div className="mt-2 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="field-label">Full name</p>
                  <Input value={demographicsForm.emergencyName} onChange={(e) => updateDemographics("emergencyName", e.target.value)} />
                </div>
                <div>
                  <p className="field-label">Relationship</p>
                  <Select
                    value={demographicsForm.emergencyRelationship}
                    onChange={(value) => updateDemographics("emergencyRelationship", value)}
                    options={relationshipOptions.map((value) => ({ value, label: value }))}
                  />
                </div>
                <div>
                  <p className="field-label">Phone number</p>
                  <Input value={demographicsForm.emergencyPhone} onChange={(e) => updateDemographics("emergencyPhone", e.target.value)} />
                </div>
              </div>
            </section>

            <section>
              <p className="text-[14px] font-semibold text-[#30323a]">Insurance information</p>
              <div className="mt-2 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="field-label">Insurance plan</p>
                  <Input value={demographicsForm.insurancePlan} onChange={(e) => updateDemographics("insurancePlan", e.target.value)} />
                </div>
                <div>
                  <p className="field-label">Member ID</p>
                  <Input value={demographicsForm.memberId} onChange={(e) => updateDemographics("memberId", e.target.value)} />
                </div>
                <div>
                  <p className="field-label">Group number</p>
                  <Input value={demographicsForm.groupNumber} onChange={(e) => updateDemographics("groupNumber", e.target.value)} />
                </div>
              </div>
            </section>
          </div>
        )}

        <div className="mt-7 flex justify-end">
          <Button size="lg" onClick={() => router.push("/voice-recording")}>
            Next
          </Button>
        </div>
      </section>

      {isMedicationModalOpen ? (
        <Modal title="Add medication" onClose={() => setMedicationModalOpen(false)}>
          <div className="space-y-3">
            <div>
              <p className="field-label">Medication name *</p>
              <Input value={newMedication.name} onChange={(event) => setNewMedication((prev) => ({ ...prev, name: event.target.value }))} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="field-label">Dosage</p>
                <Input value={newMedication.dosage} onChange={(event) => setNewMedication((prev) => ({ ...prev, dosage: event.target.value }))} />
              </div>
              <div>
                <p className="field-label">Frequency</p>
                <Input
                  value={newMedication.frequency}
                  onChange={(event) => setNewMedication((prev) => ({ ...prev, frequency: event.target.value }))}
                />
              </div>
            </div>
            <div>
              <p className="field-label">Notes</p>
              <Textarea
                className="min-h-[84px]"
                value={newMedication.notes}
                onChange={(event) => setNewMedication((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setMedicationModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addMedication}>Save medication</Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {isAllergyModalOpen ? (
        <Modal title="Add allergy" onClose={() => setAllergyModalOpen(false)}>
          <div className="space-y-3">
            <div>
              <p className="field-label">Allergen *</p>
              <Input value={newAllergy.allergen} onChange={(event) => setNewAllergy((prev) => ({ ...prev, allergen: event.target.value }))} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="field-label">Reaction</p>
                <Input value={newAllergy.reaction} onChange={(event) => setNewAllergy((prev) => ({ ...prev, reaction: event.target.value }))} />
              </div>
              <div>
                <p className="field-label">Severity</p>
                <Select
                  value={newAllergy.severity}
                  onChange={(value) => setNewAllergy((prev) => ({ ...prev, severity: value as Allergy["severity"] }))}
                  options={severityOptions.map((value) => ({ value, label: value }))}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAllergyModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addAllergy}>Save allergy</Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {isPrintModalOpen ? (
        <Modal title="Review and print" onClose={() => setPrintModalOpen(false)}>
          <div className="space-y-3">
            <p className="text-[14px] text-[#4b4d58]">
              Verify this summary before printing or sharing with your care team. This includes current conditions,
              medications, allergies, and your contact details.
            </p>
            <div className="rounded-xl border border-[#d9dae2] bg-[#f8f8fc] p-3 text-[14px] text-[#3b3d45]">
              <p>
                <span className="font-semibold">Member:</span> {selectedMemberName}
              </p>
              <p>
                <span className="font-semibold">Conditions:</span> {healthForm.currentConditions.join(", ") || "None listed"}
              </p>
              <p>
                <span className="font-semibold">Medications:</span> {healthForm.medications.length}
              </p>
              <p>
                <span className="font-semibold">Allergies:</span> {healthForm.allergies.length}
              </p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPrintModalOpen(false)}>
                Close
              </Button>
              <Button onClick={() => window.print()}>Print now</Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </WorkflowShell>
  );
}
