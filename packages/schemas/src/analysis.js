"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisBundleSchema = exports.CompetitorAnalysisSchema = exports.ReviewAnalysisSchema = exports.ScreenshotAnalysisSchema = exports.DescriptionAnalysisSchema = exports.SubtitleAnalysisSchema = exports.TitleAnalysisSchema = exports.TextAnalysisSchema = exports.FindingSchema = void 0;
const zod_1 = require("zod");

exports.FindingSchema = zod_1.z.object({
    label: zod_1.z.string(),
    detail: zod_1.z.string(),
    severity: zod_1.z.enum(["positive", "info", "warning", "critical"]).default("info"),
});
exports.TextAnalysisSchema = zod_1.z.object({
    score: zod_1.z.number().min(0).max(100),
    findings: zod_1.z.array(exports.FindingSchema),
    recommendations: zod_1.z.array(zod_1.z.string()),
});
exports.TitleAnalysisSchema = exports.TextAnalysisSchema;
exports.SubtitleAnalysisSchema = exports.TextAnalysisSchema;
exports.DescriptionAnalysisSchema = exports.TextAnalysisSchema;
exports.ScreenshotAnalysisSchema = zod_1.z.object({
    score: zod_1.z.number().min(0).max(100),
    strengths: zod_1.z.array(zod_1.z.string()),
    weaknesses: zod_1.z.array(zod_1.z.string()),
    recommendations: zod_1.z.array(zod_1.z.string()),
});
exports.ReviewAnalysisSchema = zod_1.z.object({
    score: zod_1.z.number().min(0).max(100),
    sentiment: zod_1.z.enum(["positive", "mixed", "negative"]),
    positiveThemes: zod_1.z.array(zod_1.z.string()),
    complaintThemes: zod_1.z.array(zod_1.z.string()),
    trustIndicators: zod_1.z.array(zod_1.z.string()),
    recommendations: zod_1.z.array(zod_1.z.string()),
});
exports.CompetitorAnalysisSchema = zod_1.z.object({
    score: zod_1.z.number().min(0).max(100),
    strengths: zod_1.z.array(zod_1.z.string()),
    weaknesses: zod_1.z.array(zod_1.z.string()),
    opportunities: zod_1.z.array(zod_1.z.string()),
});

exports.AnalysisBundleSchema = zod_1.z.object({
    title: exports.TitleAnalysisSchema,
    subtitle: exports.SubtitleAnalysisSchema.nullable(),
    description: exports.DescriptionAnalysisSchema,
    screenshots: exports.ScreenshotAnalysisSchema.nullable(),
    reviews: exports.ReviewAnalysisSchema.nullable(),
    competitors: exports.CompetitorAnalysisSchema.nullable(),
});
