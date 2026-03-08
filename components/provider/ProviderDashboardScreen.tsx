"use client";

import {
  ArrowUpRight,
  ChevronDown,
  ClipboardList,
  Filter,
  LayoutList,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Stethoscope,
  UserCircle2,
  Users
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { demoPatientProfile } from "@/lib/demo-profile";
import { readVoiceRiskScreening } from "@/lib/ml/browser-storage";
import type { RiskLevel } from "@/lib/types";
import { locationOptions, physicianOptions, providerNavItems, serviceOptions, type ProviderNavId } from "./provider-mock";

function navIcon(id: ProviderNavId) {
  if (id === "queue") return <LayoutList size={14} />;
  if (id === "care_locations") return <MapPin size={14} />;
  if (id === "patients") return <Users size={14} />;
  if (id === "encounters") return <ClipboardList size={14} />;
  return <Stethoscope size={14} />;
}

function formatDateIsoToUs(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${month}/${day}/${year}`;
}

const inNetworkPsychiatristReferrals = [
  "Dr. Elena Martinez, MD",
  "Dr. Priya Narayanan, MD",
  "Dr. Jonathan Kim, MD",
  "Dr. Sophia Caldwell, DO",
  "Dr. Marcus Lee, MD"
];

export function ProviderDashboardScreen() {
  const [expressWellnessScore, setExpressWellnessScore] = useState<RiskLevel | null>(null);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<string | null>(null);

  useEffect(() => {
    const syncScore = () => {
      const stored = readVoiceRiskScreening();
      if (stored?.risk_level) {
        setExpressWellnessScore(stored.risk_level);
      } else {
        setExpressWellnessScore(null);
      }
    };

    syncScore();
    const interval = window.setInterval(syncScore, 1500);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const expressScoreClass = useMemo(() => {
    if (expressWellnessScore === "high") return "text-[#b5232f]";
    if (expressWellnessScore === "medium") return "text-[#9b5f00]";
    if (expressWellnessScore === "low") return "text-[#1b7e43]";
    return "text-[#6a7183]";
  }, [expressWellnessScore]);
  const hasReferralAccess = expressWellnessScore === "low" || expressWellnessScore === "medium" || expressWellnessScore === "high";

  const encounter = {
    createdDate: "Today",
    createdTime: "09:42 AM PT",
    createdBy: "Patient Intake",
    patientName: `${demoPatientProfile.lastName}, ${demoPatientProfile.firstName}`,
    patientId: demoPatientProfile.demographics.memberId,
    dob: formatDateIsoToUs(demoPatientProfile.demographics.dateOfBirth),
    reasonForVisit: demoPatientProfile.health.symptomsConcerns,
    location: `${demoPatientProfile.demographics.city}, ${demoPatientProfile.demographics.state}`,
    status: "Not Started"
  };

  return (
    <div className="min-h-screen bg-[#eef1f6] px-4 py-4 lg:px-6">
      <header className="mx-auto flex w-full max-w-[1540px] items-center gap-4 rounded-xl border border-[#dce1eb] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(29,44,76,0.06)]">
        <Link href="/" className="leading-none">
          <div className="text-[24px] font-extrabold tracking-[-0.4px] text-[#2D2D8C]">Teladoc</div>
          <div className="-mt-[5px] text-[8px] font-semibold uppercase tracking-[0.8px] text-[#0EA5B7]">Health</div>
        </Link>

        <div className="hidden min-w-[300px] flex-1 items-center rounded-lg border border-[#d8ddea] bg-[#f8faff] px-3 py-2 md:flex">
          <Search size={16} className="text-[#8a8f9d]" />
          <input
            readOnly
            value=""
            placeholder="Patient Name or Identifier"
            className="w-full border-none bg-transparent px-2 text-[15px] text-[#2d313b] outline-none"
          />
        </div>

        <button
          type="button"
          className="ml-auto inline-flex h-10 cursor-default items-center gap-2 rounded-lg border border-[#ced3dd] bg-white px-4 text-[14px] text-[#2b2f39]"
        >
          Practitioner
          <ChevronDown size={14} className="text-[#7f8595]" />
        </button>

        <button type="button" className="relative inline-flex h-10 w-10 cursor-default items-center justify-center rounded-full bg-[#d9dde5] text-[#5c6477]">
          <UserCircle2 size={20} />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-white bg-[#29d169]" />
        </button>
      </header>

      <div className="mx-auto mt-4 grid w-full max-w-[1540px] gap-4 lg:grid-cols-[220px_minmax(0,1fr)_330px]">
        <aside className="rounded-xl border border-[#d7dde9] bg-[#1f2228] p-3 text-[#eef1f8] shadow-[0_8px_18px_rgba(10,14,22,0.18)]">
          <nav className="space-y-1">
            {providerNavItems.map((item) => {
              const active = item.id === "encounters";
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`flex h-10 w-full cursor-default items-center gap-3 rounded-lg px-3 text-left text-[14px] ${
                    active ? "bg-[#0f4f7f] text-white" : "text-[#dde3f0]"
                  }`}
                >
                  {navIcon(item.id)}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="rounded-xl border border-[#d9deea] bg-white p-4 shadow-[0_8px_18px_rgba(29,44,76,0.06)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-[40px] font-semibold leading-none text-[#2a2d34]">Encounters</h1>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 cursor-default items-center gap-2 rounded-lg border border-[#b9c0cf] bg-white px-4 text-[15px] text-[#545a68]"
              >
                Add Encounter
                <Plus size={16} />
              </button>

              <button type="button" className="inline-flex h-10 cursor-default items-center gap-2 rounded-lg bg-[#f0f5fb] px-3 text-[14px] font-semibold text-[#165f92]">
                <Filter size={16} />
                Hide Filters
                <span className="rounded-full bg-[#1f72ac] px-1.5 text-[11px] text-white">1</span>
              </button>
            </div>
          </div>

          <article className="relative overflow-hidden rounded-xl border border-[#dde1ea] bg-[#fbfcff]">
            <div className="grid gap-0 lg:grid-cols-[185px_1fr_130px_1.1fr_190px_240px_220px_140px]">
              <div className="border-b border-[#ecf0f6] p-3 text-[13px] text-[#5f6678] lg:border-b-0 lg:border-r">
                <p className="font-medium">Created at</p>
                <p className="font-semibold text-[#394053]">{encounter.createdDate}</p>
                <p>{encounter.createdTime}</p>
                <p className="mt-2 font-medium">Created by</p>
                <p className="font-semibold text-[#394053]">{encounter.createdBy}</p>
                <span className="mt-2 inline-block text-[12px] font-semibold text-[#0f66a3]">Show More</span>
              </div>

              <div className="border-b border-[#ecf0f6] p-3 lg:border-b-0 lg:border-r">
                <p className="text-[36px] leading-[0.95] tracking-[-0.2px] text-[#232730]">{encounter.patientName}</p>
                <p className="mt-1 text-[13px] text-[#596075]">{encounter.patientId}</p>
              </div>

              <div className="border-b border-[#ecf0f6] p-3 text-[13px] text-[#52596d] lg:border-b-0 lg:border-r">
                <p className="font-medium">DOB</p>
                <p className="font-semibold text-[#2a2e38]">{encounter.dob}</p>
              </div>

              <div className="border-b border-[#ecf0f6] p-3 text-[13px] text-[#52596d] lg:border-b-0 lg:border-r">
                <p className="font-medium">Reason for Visit</p>
                <p className="font-semibold text-[#2a2e38]">{encounter.reasonForVisit}</p>
              </div>

              <div className="border-b border-[#ecf0f6] p-3 text-[13px] text-[#52596d] lg:border-b-0 lg:border-r">
                <p className="font-medium">Express Wellness Score</p>
                <p className={`font-semibold uppercase tracking-[0.02em] ${expressScoreClass}`}>
                  {expressWellnessScore ?? "Pending"}
                </p>
              </div>

              <div className="border-b border-[#ecf0f6] p-3 text-[13px] text-[#52596d] lg:border-b-0 lg:border-r">
                <p className="font-medium">Psychiatrist Referrals</p>
                {hasReferralAccess ? (
                  <button
                    type="button"
                    onClick={() => setIsReferralModalOpen(true)}
                    className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#c7d2e9] bg-white px-3 text-[13px] font-semibold text-[#2f5aa8]"
                  >
                    Outbound
                    <ArrowUpRight size={14} />
                  </button>
                ) : (
                  <p className="mt-2 text-[12px] text-[#7a8194]">Available for medium or high scores</p>
                )}
              </div>

              <div className="border-b border-[#ecf0f6] p-3 text-[13px] text-[#52596d] lg:border-b-0 lg:border-r">
                <p className="font-medium">Location</p>
                <p className="font-semibold text-[#2a2e38]">{encounter.location}</p>
              </div>

              <div className="flex items-center justify-center p-3 text-[14px] font-semibold text-[#23252d]">{encounter.status}</div>
            </div>

            <span className="absolute right-0 top-0 h-full w-[4px] bg-[#24c25d]" />
          </article>
        </section>

        <aside className="rounded-xl border border-[#d9deea] bg-white p-4 shadow-[0_8px_18px_rgba(29,44,76,0.06)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[34px] font-semibold leading-none text-[#2c3038]">Filters</p>
            <button type="button" className="cursor-default text-[14px] font-semibold text-[#1870ab]">
              Clear All
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="mb-1 text-[13px] font-semibold text-[#5e6575]">Period of Time</p>
              <button type="button" className="flex h-10 w-full cursor-default items-center justify-between rounded-lg border border-[#d8dde8] bg-[#fbfcfe] px-3 text-[14px] text-[#5a6171]">
                <span>Select...</span>
                <ChevronDown size={14} />
              </button>
            </div>

            <div>
              <p className="mb-1 text-[13px] font-semibold text-[#5e6575]">Service</p>
              <button type="button" className="flex h-10 w-full cursor-default items-center justify-between rounded-lg border border-[#d8dde8] bg-[#fbfcfe] px-3 text-[14px] text-[#444b5e]">
                <span>{serviceOptions[0]}</span>
                <ChevronDown size={14} />
              </button>
            </div>

            <div>
              <p className="mb-1 text-[13px] font-semibold text-[#5e6575]">Locations</p>
              <button type="button" className="flex h-10 w-full cursor-default items-center justify-between rounded-lg border border-[#d8dde8] bg-[#fbfcfe] px-3 text-[14px] text-[#5a6171]">
                <span>{locationOptions[0]}</span>
                <ChevronDown size={14} />
              </button>
            </div>

            <div>
              <p className="mb-1 text-[13px] font-semibold text-[#5e6575]">Physicians</p>
              <button type="button" className="flex h-10 w-full cursor-default items-center justify-between rounded-lg border border-[#d8dde8] bg-[#fbfcfe] px-3 text-[14px] text-[#5a6171]">
                <span>{physicianOptions[0]}</span>
                <ChevronDown size={14} />
              </button>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-[#5e6575]">Encounter Statuses</p>
                <button type="button" className="cursor-default text-[12px] font-semibold text-[#1870ab]">
                  Select All
                </button>
              </div>

              <div className="grid grid-cols-2 gap-y-1 text-[13px] text-[#4b5265]">
                <label className="inline-flex items-center gap-1.5">
                  <input type="checkbox" checked readOnly />
                  Not Started
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input type="checkbox" readOnly />
                  In Progress
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input type="checkbox" readOnly />
                  Canceled
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input type="checkbox" readOnly />
                  Completed
                </label>
              </div>
            </div>

            <div>
              <p className="mb-1 text-[13px] font-semibold text-[#5e6575]">Consult Notes Status</p>
              <button type="button" className="flex h-10 w-full cursor-default items-center justify-between rounded-lg border border-[#d8dde8] bg-[#fbfcfe] px-3 text-[14px] text-[#5a6171]">
                <span>Select Status</span>
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </aside>
      </div>

      <button
        type="button"
        className="fixed bottom-5 right-5 inline-flex cursor-default items-center gap-2 rounded-lg bg-[#00a0df] px-3 py-2 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(0,94,143,0.35)]"
      >
        <MessageSquare size={14} />
        Live Chat With Support
      </button>

      {isReferralModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f1526]/35 p-4">
          <div className="w-full max-w-[520px] rounded-xl border border-[#d8dfef] bg-white p-5 shadow-[0_20px_36px_rgba(25,39,74,0.22)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[22px] font-semibold text-[#212432]">Psychiatrist Referrals</h2>
                <p className="mt-1 text-[14px] text-[#5f677b]">In-network Teladoc psychiatrists available for referral.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsReferralModalOpen(false)}
                className="rounded-md border border-[#d4d9e7] px-2 py-1 text-[12px] font-semibold text-[#5f6780]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 max-h-[230px] space-y-2 overflow-y-auto pr-1">
              {inNetworkPsychiatristReferrals.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setSelectedReferral(name);
                    setIsReferralModalOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-[#dee3ef] bg-[#f9fbff] px-3 py-2 text-left text-[14px] font-medium text-[#2f3a58]"
                >
                  <span>{name}</span>
                  <ArrowUpRight size={14} className="text-[#60709d]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {selectedReferral ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1526]/40 p-4">
          <div className="w-full max-w-[460px] rounded-xl border border-[#d8dfef] bg-white p-5 shadow-[0_20px_36px_rgba(25,39,74,0.22)]">
            <h3 className="text-[20px] font-semibold text-[#232634]">Referral Confirmation</h3>
            <p className="mt-2 text-[14px] text-[#4e5569]">Refer patient to in-network psychiatrist.</p>
            <p className="mt-1 text-[14px] font-semibold text-[#2f3a58]">{selectedReferral}</p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedReferral(null)}
                className="rounded-lg border border-[#d0d7e8] bg-white px-4 py-2 text-[13px] font-semibold text-[#57607a]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setSelectedReferral(null)}
                className="rounded-lg bg-[#415fae] px-4 py-2 text-[13px] font-semibold text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
