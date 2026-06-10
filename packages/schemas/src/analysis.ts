import { z } from "zod";


export const FindingSchema = z.object({
  label: z.string(),
  detail: z.string(),
  severity: z.enum(["positive", "info", "warning", "critical"]).default("info"),
});
export type Finding = z.infer<typeof FindingSchema>;

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

export const ScreenshotAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()),
});
export type ScreenshotAnalysis = z.infer<typeof ScreenshotAnalysisSchema>;

export const ReviewAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  sentiment: z.enum(["positive", "mixed", "negative"]),
  positiveThemes: z.array(z.string()),
  complaintThemes: z.array(z.string()),
  trustIndicators: z.array(z.string()),
  recommendations: z.array(z.string()),
});
export type ReviewAnalysis = z.infer<typeof ReviewAnalysisSchema>;

export const CompetitorAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
});
export type CompetitorAnalysis = z.infer<typeof CompetitorAnalysisSchema>;

export const AnalysisBundleSchema = z.object({
  title: TitleAnalysisSchema,
  subtitle: SubtitleAnalysisSchema.nullable(),
  description: DescriptionAnalysisSchema,
  screenshots: ScreenshotAnalysisSchema.nullable(),
  reviews: ReviewAnalysisSchema.nullable(),
  competitors: CompetitorAnalysisSchema.nullable(),
});
export type AnalysisBundle = z.infer<typeof AnalysisBundleSchema>;
