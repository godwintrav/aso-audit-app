import { z } from "zod";

export const DimensionKeySchema = z.enum([
  "title",
  "subtitle",
  "keywordField",
  "description",
  "screenshots",
  "appPreviewVideo",
  "ratingsAndReviews",
  "icon",
  "conversionSignals",
  "competitivePosition",
]);
export type DimensionKey = z.infer<typeof DimensionKeySchema>;

export const DimensionScoreSchema = z.object({
  dimension: DimensionKeySchema,
  label: z.string(),
  weight: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
  weightedScore: z.number().min(0).max(100),
  summary: z.string(),
});
export type DimensionScore = z.infer<typeof DimensionScoreSchema>;
