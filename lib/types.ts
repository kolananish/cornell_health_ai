export type Member = {
  id: string;
  name: string;
};

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  notes?: string;
};

export type Allergy = {
  id: string;
  allergen: string;
  reaction: string;
  severity: "Low" | "Moderate" | "High";
};

export type HealthFormData = {
  currentConditions: string[];
  medications: Medication[];
  allergies: Allergy[];
  pastDiagnoses: string;
  procedures: string;
  tobaccoUse: string;
  alcoholUse: string;
  exerciseFrequency: string;
  avgSleepHours: string;
  symptomsConcerns: string;
  familyHistory: string;
};

export type DemographicsFormData = {
  firstName: string;
  lastName: string;
  dob: string;
  biologicalSex: string;
  genderIdentity: string;
  heightFeet: string;
  heightInches: string;
  weightLbs: string;
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

export type RecordingStatus = "ready" | "recording" | "processing" | "stopped" | "error";

export type RecordingItem = {
  id: string;
  createdAt: string;
  durationSeconds: number;
  blob: Blob;
  mimeType: string;
};

export type RiskLevel = "low" | "medium" | "high";

export type FeatureMap = Record<string, number | null>;

export type AudioAnalysisInput = {
  recordingId: string;
  durationSeconds: number;
  sampleRateHz: number;
  acousticFeatures: FeatureMap;
  metaFeatures: FeatureMap;
  transcript?: string;
};

export type FeatureContribution = {
  feature: string;
  contribution: number;
  normalizedValue: number;
  rawValue: number;
};

export type ModelTargetResult = {
  name: string;
  probability: number;
  threshold: number;
  thresholdBalanced: number;
  riskLevel: RiskLevel;
  margin: number;
  topPositiveContributors: FeatureContribution[];
  topNegativeContributors: FeatureContribution[];
};

export type ModelQuality = {
  observedAcousticCount: number;
  imputedAcousticCount: number;
  observedMetaCount: number;
  imputedMetaCount: number;
  confidenceModifier: number;
};

export type ModelAggregateResult = {
  overallRisk: RiskLevel;
  strongestSignalTarget: string;
  caveats: string[];
};

export type AudioAnalysisResult = {
  requestId: string;
  modelVersion: string;
  summary: string;
  riskFlags: string[];
  confidence: number;
  recommendedFollowUp: string;
  targets: ModelTargetResult[];
  aggregate: ModelAggregateResult;
  quality: ModelQuality;
};

export interface AnalysisAdapter {
  analyze(input: AudioAnalysisInput): Promise<AudioAnalysisResult>;
}
