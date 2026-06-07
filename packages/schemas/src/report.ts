import { z } from "zod";
import { CompetitorSchema } from "./app-listing";
import { ScreenshotAnalysisSchema } from "./analysis";
import { DimensionScoreSchema } from "./scoring";
import { RecommendationSchema } from "./recommendation";

/** Lightweight summary of the audited app, embedded in the report. */
export const AppSummarySchema = z.object({
  appId: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  developer: z.string(),
  category: z.string(),
  iconUrl: z.string().url(),
  rating: z.number(),
  ratingCount: z.number().int().nonnegative(),
});
export type AppSummary = z.infer<typeof AppSummarySchema>;

/** One row of the competitor comparison table. */
export const CompetitorComparisonRowSchema = z.object({
  competitor: CompetitorSchema,
  positioning: z.string(),
  metadataQuality: z.enum(["weaker", "comparable", "stronger"]),
  screenshotQuality: z.enum(["weaker", "comparable", "stronger"]),
});
export type CompetitorComparisonRow = z.infer<
  typeof CompetitorComparisonRowSchema
>;

/** The final, fully-assembled audit report returned to the frontend. */
export const AuditReportSchema = z.object({
  appId: z.string(),
  app: AppSummarySchema,
  overallScore: z.number().min(0).max(100),
  dimensions: z.array(DimensionScoreSchema),
  screenshots: z.array(z.string().url()),
  screenshotAnalysis: ScreenshotAnalysisSchema.nullable(),
  competitorComparison: z.array(CompetitorComparisonRowSchema),
  quickWins: z.array(RecommendationSchema),
  highImpact: z.array(RecommendationSchema),
  strategic: z.array(RecommendationSchema),
  warnings: z.array(z.string()),
  generatedAt: z.string(),
});
export type AuditReport = z.infer<typeof AuditReportSchema>;
