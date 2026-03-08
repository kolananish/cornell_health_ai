export type ProviderNavId = "queue" | "care_locations" | "patients" | "encounters" | "services";

export const providerNavItems: Array<{ id: ProviderNavId; label: string }> = [
  { id: "queue", label: "Queue" },
  { id: "care_locations", label: "Care Locations" },
  { id: "patients", label: "Patients" },
  { id: "encounters", label: "Encounters" },
  { id: "services", label: "Services" }
];

export const periodOptions = ["Today", "Last 7 days", "Last 30 days"];
export const serviceOptions = ["Goleta Hospital", "Santa Barbara Medical", "Cottage Health"];
export const locationOptions = ["Goleta Clinic", "Santa Barbara Office", "San Diego Wellness Center"];
export const physicianOptions = ["Dr. Anya Shah", "Dr. Robert Kim", "Dr. Jordan Lee"];
