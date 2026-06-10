import { z } from "zod";

export const RecommendationCategorySchema = z.enum([
  "quick_win",
  "high_impact",
  "strategic",
]);
export type RecommendationCategory = z.infer<
  typeof RecommendationCategorySchema
>;

export const EffortLevelSchema = z.enum(["low", "medium", "high"]);
export const ImpactLevelSchema = z.enum(["low", "medium", "high"]);

export const RecommendationSchema = z.object({
  category: RecommendationCategorySchema,
  title: z.string(),
  evidence: z.string(),
  reason: z.string(),
  impact: ImpactLevelSchema,
  effort: EffortLevelSchema,
  before: z.string().optional(),
  after: z.string().optional(),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

export const RecommendationSetSchema = z.object({
  quickWins: z.array(RecommendationSchema),
  highImpact: z.array(RecommendationSchema),
  strategic: z.array(RecommendationSchema),
});
export type RecommendationSet = z.infer<typeof RecommendationSetSchema>;
