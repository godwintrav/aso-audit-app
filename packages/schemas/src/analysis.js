"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisBundleSchema = exports.CompetitorAnalysisSchema = exports.ReviewAnalysisSchema = exports.ScreenshotAnalysisSchema = exports.DescriptionAnalysisSchema = exports.SubtitleAnalysisSchema = exports.TitleAnalysisSchema = exports.TextAnalysisSchema = exports.FindingSchema = void 0;
const zod_1 = require("zod");
/**
 * Schemas for the structured output of each analysis tool. These are the
 * contracts the LLM must satisfy — every model response is validated against
 * one of these before it is allowed into the system.
 */
/** A single observation produced by an analysis tool. */
exports.FindingSchema = zod_1.z.object({
    label: zod_1.z.string(),
    detail: zod_1.z.string(),
    severity: zod_1.z.enum(["positive", "info", "warning", "critical"]).default("info"),
});
/** Shared shape for the text-metadata analyses (title / subtitle / description). */
exports.TextAnalysisSchema = zod_1.z.object({
    score: zod_1.z.number().min(0).max(100),
    findings: zod_1.z.array(exports.FindingSchema),
    recommendations: zod_1.z.array(zod_1.z.string()),
});
exports.TitleAnalysisSchema = exports.TextAnalysisSchema;
exports.SubtitleAnalysisSchema = exports.TextAnalysisSchema;
exports.DescriptionAnalysisSchema = exports.TextAnalysisSchema;
/** Vision analysis of the screenshot gallery (GPT-4o vision). */
exports.ScreenshotAnalysisSchema = zod_1.z.object({
    score: zod_1.z.number().min(0).max(100),
    strengths: zod_1.z.array(zod_1.z.string()),
    weaknesses: zod_1.z.array(zod_1.z.string()),
    recommendations: zod_1.z.array(zod_1.z.string()),
});
/** Sentiment + theme analysis of user reviews. */
exports.ReviewAnalysisSchema = zod_1.z.object({
    score: zod_1.z.number().min(0).max(100),
    sentiment: zod_1.z.enum(["positive", "mixed", "negative"]),
    positiveThemes: zod_1.z.array(zod_1.z.string()),
    complaintThemes: zod_1.z.array(zod_1.z.string()),
    trustIndicators: zod_1.z.array(zod_1.z.string()),
    recommendations: zod_1.z.array(zod_1.z.string()),
});
/** Competitive positioning analysis. */
exports.CompetitorAnalysisSchema = zod_1.z.object({
    score: zod_1.z.number().min(0).max(100),
    strengths: zod_1.z.array(zod_1.z.string()),
    weaknesses: zod_1.z.array(zod_1.z.string()),
    opportunities: zod_1.z.array(zod_1.z.string()),
});
/**
 * The bundle of analysis results produced by the parallel stage of the
 * workflow. Optional fields degrade gracefully when source data is missing.
 */
exports.AnalysisBundleSchema = zod_1.z.object({
    title: exports.TitleAnalysisSchema,
    subtitle: exports.SubtitleAnalysisSchema.nullable(),
    description: exports.DescriptionAnalysisSchema,
    screenshots: exports.ScreenshotAnalysisSchema.nullable(),
    reviews: exports.ReviewAnalysisSchema.nullable(),
    competitors: exports.CompetitorAnalysisSchema.nullable(),
});
//# sourceMappingURL=analysis.js.map