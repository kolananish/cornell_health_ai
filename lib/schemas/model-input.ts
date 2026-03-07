import { z } from "zod";

const featureMapSchema = z.record(z.string(), z.number().finite().nullable());

export const modelAnalyzeRequestSchema = z.object({
  recordingId: z.string().min(3).max(128),
  durationSeconds: z.number().finite().min(1).max(600),
  sampleRateHz: z.number().finite().min(8000).max(96000),
  acousticFeatures: featureMapSchema,
  metaFeatures: featureMapSchema,
  transcript: z.string().max(1000).optional()
});

export type ModelAnalyzeRequest = z.infer<typeof modelAnalyzeRequestSchema>;
