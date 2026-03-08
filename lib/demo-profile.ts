import type { VoiceMetadata } from "@/lib/types";

export type DemoConditionFlags = {
  depression: boolean;
  gad: boolean;
  ptsd: boolean;
  insomnia: boolean;
  bipolar: boolean;
  panic: boolean;
  social_anxiety: boolean;
  ocd: boolean;
};

export type DemoPatientProfile = {
  firstName: string;
  lastName: string;
  demographics: {
    age: number;
    sex: "Female" | "Male";
    education: string;
    dateOfBirth: string;
    genderIdentity: string;
    race: string;
    ethnicity: string;
    preferredLanguage: string;
    phone: string;
    email: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    emergencyName: string;
    emergencyRelationship: string;
    emergencyPhone: string;
    insurancePlan: string;
    memberId: string;
    groupNumber: string;
  };
  health: {
    currentConditions: string[];
    medications: Array<{ name: string; dosage: string; frequency: string }>;
    allergies: Array<{ allergen: string; reaction: string; severity: "Low" | "Moderate" | "High" }>;
    pastDiagnoses: string;
    procedures: string;
    tobaccoUse: string;
    alcoholUse: string;
    exerciseFrequency: string;
    avgSleepHours: string;
    symptomsConcerns: string;
    familyHistory: string;
  };
  conditions: DemoConditionFlags;
};

export const demoPatientProfile: DemoPatientProfile = {
  firstName: "Maya",
  lastName: "Patel",
  demographics: {
    age: 34,
    sex: "Female",
    education: "Bachelor's degree",
    dateOfBirth: "1991-04-16",
    genderIdentity: "Woman",
    race: "Asian",
    ethnicity: "Not Hispanic or Latino",
    preferredLanguage: "English",
    phone: "(415) 555-0104",
    email: "maya.patel@email.com",
    address1: "221B Pine Street",
    address2: "Unit 8",
    city: "San Francisco",
    state: "CA",
    zip: "94107",
    emergencyName: "Arjun Patel",
    emergencyRelationship: "Spouse",
    emergencyPhone: "(415) 555-0171",
    insurancePlan: "Blue Shield PPO",
    memberId: "BSC-9927411",
    groupNumber: "GRP-44102"
  },
  health: {
    currentConditions: ["None reported"],
    medications: [{ name: "Vitamin D", dosage: "2000 IU", frequency: "Daily" }],
    allergies: [{ allergen: "None reported", reaction: "N/A", severity: "Low" }],
    pastDiagnoses: "No chronic diagnosis documented.",
    procedures: "Wisdom tooth extraction (2012)",
    tobaccoUse: "Never",
    alcoholUse: "1-2 drinks/week",
    exerciseFrequency: "3-4x/week",
    avgSleepHours: "7",
    symptomsConcerns: "Intermittent fatigue during high-workload weeks.",
    familyHistory: "Mother: Hypertension\nFather: Type 2 diabetes"
  },
  conditions: {
    depression: false,
    gad: false,
    ptsd: false,
    insomnia: false,
    bipolar: false,
    panic: false,
    social_anxiety: false,
    ocd: false
  }
};

export const demoModelMetadata: VoiceMetadata = {
  age_num: 34,
  is_female: true,
  edu_num: 4,
  sr_depression: false,
  sr_gad: false,
  sr_ptsd: false,
  sr_insomnia: false,
  sr_bipolar: false,
  sr_panic: false,
  sr_soc_anx_dis: false,
  sr_ocd: false
};
