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

export type ThresholdMode = "balanced" | "high_sensitivity";

export type VoiceTask = "rainbow" | "free_speech";

export type VoiceMetadata = {
  age_num: number;
  is_female: boolean;
  edu_num: number;
  sr_depression: boolean;
  sr_gad: boolean;
  sr_ptsd: boolean;
  sr_insomnia: boolean;
  sr_bipolar: boolean;
  sr_panic: boolean;
  sr_soc_anx_dis: boolean;
  sr_ocd: boolean;
};

export type VoiceClip = {
  blob: Blob;
  durationSeconds: number;
  mimeType: string;
};

export type VoiceAnalysisInput = {
  rainbowClip: VoiceClip;
  freeSpeechClip: VoiceClip;
  metadata: VoiceMetadata;
  transcript?: string;
  thresholdMode?: ThresholdMode;
};

export type VoiceIndicator = {
  feature: string;
  value: number;
  z_score: number;
  direction: "higher_than_reference" | "lower_than_reference";
};

export type VoiceModelTarget = {
  probability: number;
  threshold: number;
  threshold_balanced: number;
  threshold_high_sensitivity: number;
  threshold_mode: ThresholdMode;
  flag: boolean;
  auc?: number;
};

export type VoiceFeatureCoverage = {
  total: number;
  computed: number;
  missing: number;
};

export type VoiceAnalysisResult = {
  request_id: string;
  model_version: string;
  screening: {
    phq_mod_plus: VoiceModelTarget;
  };
  risk_level: RiskLevel;
  top_voice_indicators: VoiceIndicator[];
  suggested_action: string;
  n_features_computed: number;
  feature_coverage: VoiceFeatureCoverage;
  processing_ms: number;
  caveats: string[];
};

export interface AnalysisAdapter {
  analyze(input: VoiceAnalysisInput): Promise<VoiceAnalysisResult>;
}
