import { z } from "zod";

/**
 * The ten ASO scoring dimensions. Kept here (next to the schema that uses
 * them) so the schema package stays self-contained; weights live in @aso/core.
 */
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
  /** Weight as a percentage of the overall score (0–100). */
  weight: z.number().min(0).max(100),
  /** Raw quality score for this dimension (0–100). */
  score: z.number().min(0).max(100),
  /** score * (weight / 100), pre-normalization. */
  weightedScore: z.number().min(0).max(100),
  summary: z.string(),
});
export type DimensionScore = z.infer<typeof DimensionScoreSchema>;
