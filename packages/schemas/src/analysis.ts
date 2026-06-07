import { z } from "zod";

/**
 * Schemas for the structured output of each analysis tool. These are the
 * contracts the LLM must satisfy — every model response is validated against
 * one of these before it is allowed into the system.
 */

/** A single observation produced by an analysis tool. */
export const FindingSchema = z.object({
  label: z.string(),
  detail: z.string(),
  severity: z.enum(["positive", "info", "warning", "critical"]).default("info"),
});
export type Finding = z.infer<typeof FindingSchema>;

/** Shared shape for the text-metadata analyses (title / subtitle / description). */
export const TextAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  findings: z.array(FindingSchema),
  recommendations: z.array(z.string()),
});
export type TextAnalysis = z.infer<typeof TextAnalysisSchema>;

export const TitleAnalysisSchema = TextAnalysisSchema;
export type TitleAnalysis = z.infer<typeof TitleAnalysisSchema>;

export const SubtitleAnalysisSchema = TextAnalysisSchema;
export type SubtitleAnalysis = z.infer<typeof SubtitleAnalysisSchema>;

export const DescriptionAnalysisSchema = TextAnalysisSchema;
export type DescriptionAnalysis = z.infer<typeof DescriptionAnalysisSchema>;

/** Vision analysis of the screenshot gallery (GPT-4o vision). */
export const ScreenshotAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()),
});
export type ScreenshotAnalysis = z.infer<typeof ScreenshotAnalysisSchema>;

/** Sentiment + theme analysis of user reviews. */
export const ReviewAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  sentiment: z.enum(["positive", "mixed", "negative"]),
  positiveThemes: z.array(z.string()),
  complaintThemes: z.array(z.string()),
  trustIndicators: z.array(z.string()),
  recommendations: z.array(z.string()),
});
export type ReviewAnalysis = z.infer<typeof ReviewAnalysisSchema>;

/** Competitive positioning analysis. */
export const CompetitorAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
});
export type CompetitorAnalysis = z.infer<typeof CompetitorAnalysisSchema>;

/**
 * The bundle of analysis results produced by the parallel stage of the
 * workflow. Optional fields degrade gracefully when source data is missing.
 */
export const AnalysisBundleSchema = z.object({
  title: TitleAnalysisSchema,
  subtitle: SubtitleAnalysisSchema.nullable(),
  description: DescriptionAnalysisSchema,
  screenshots: ScreenshotAnalysisSchema.nullable(),
  reviews: ReviewAnalysisSchema.nullable(),
  competitors: CompetitorAnalysisSchema.nullable(),
});
export type AnalysisBundle = z.infer<typeof AnalysisBundleSchema>;
