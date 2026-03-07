import type { Allergy, DemographicsFormData, HealthFormData, Medication, Member } from "./types";

export const members: Member[] = [
  { id: "benedict", name: "Benedict Ho" },
  { id: "grace", name: "Grace Ho" },
  { id: "alex", name: "Alex Ho" }
];

export const availableConditions = [
  "Hypertension",
  "Type 2 Diabetes",
  "High Cholesterol",
  "Asthma",
  "Migraine",
  "GERD",
  "Thyroid Disorder",
  "Anxiety",
  "Depression",
  "Osteoarthritis",
  "None"
];

export const initialMedications: Medication[] = [
  {
    id: "med-1",
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Daily",
    notes: "Taken in morning as needed"
  }
];

export const initialAllergies: Allergy[] = [
  {
    id: "allergy-1",
    allergen: "Penicillin",
    reaction: "Hives",
    severity: "Moderate"
  },
  {
    id: "allergy-2",
    allergen: "Peanuts",
    reaction: "Anaphylaxis",
    severity: "High"
  }
];

export const initialHealthForm: HealthFormData = {
  currentConditions: ["Hypertension"],
  medications: initialMedications,
  allergies: initialAllergies,
  pastDiagnoses: "Mild asthma",
  procedures: "Appendectomy (2013)\nKnee arthroscopy (2019)",
  tobaccoUse: "Never",
  alcoholUse: "1-2 drinks/week",
  exerciseFrequency: "3-4x/week",
  avgSleepHours: "7",
  symptomsConcerns: "Occasional headaches over the last 2 months, typically after long workdays.",
  familyHistory: "Father: Type 2 diabetes\nMother: Hypothyroidism"
};

export const initialDemographicsForm: DemographicsFormData = {
  firstName: "Benedict",
  lastName: "Ho",
  dob: "1985-07-14",
  biologicalSex: "Male",
  genderIdentity: "Man",
  heightFeet: "5",
  heightInches: "11",
  weightLbs: "178",
  race: "Asian",
  ethnicity: "Not Hispanic or Latino",
  preferredLanguage: "English",
  phone: "(415) 555-0134",
  email: "benedict.ho@email.com",
  address1: "3920 Market St",
  address2: "Apt 4B",
  city: "San Francisco",
  state: "CA",
  zip: "94102",
  emergencyName: "Grace Ho",
  emergencyRelationship: "Spouse",
  emergencyPhone: "(415) 555-0177",
  insurancePlan: "Blue Shield of California",
  memberId: "BSC-4471829",
  groupNumber: "GRP-77201"
};

export const tobaccoOptions = ["Never", "Former", "Some days", "Daily"];
export const alcoholOptions = ["None", "1-2 drinks/week", "3-6 drinks/week", "Daily"];
export const exerciseOptions = ["Rarely", "1-2x/week", "3-4x/week", "5+ x/week"];
export const states = ["CA", "NY", "TX", "WA", "MA"];
