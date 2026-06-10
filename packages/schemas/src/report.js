"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditReportSchema = exports.CompetitorComparisonRowSchema = exports.AppSummarySchema = void 0;
const zod_1 = require("zod");
const app_listing_1 = require("./app-listing");
const analysis_1 = require("./analysis");
const scoring_1 = require("./scoring");
const recommendation_1 = require("./recommendation");
exports.AppSummarySchema = zod_1.z.object({
    appId: zod_1.z.string(),
    title: zod_1.z.string(),
    subtitle: zod_1.z.string().optional(),
    developer: zod_1.z.string(),
    category: zod_1.z.string(),
    iconUrl: zod_1.z.string().url(),
    rating: zod_1.z.number(),
    ratingCount: zod_1.z.number().int().nonnegative(),
});
exports.CompetitorComparisonRowSchema = zod_1.z.object({
    competitor: app_listing_1.CompetitorSchema,
    positioning: zod_1.z.string(),
    metadataQuality: zod_1.z.enum(["weaker", "comparable", "stronger"]),
    screenshotQuality: zod_1.z.enum(["weaker", "comparable", "stronger"]),
});
exports.AuditReportSchema = zod_1.z.object({
    appId: zod_1.z.string(),
    app: exports.AppSummarySchema,
    overallScore: zod_1.z.number().min(0).max(100),
    dimensions: zod_1.z.array(scoring_1.DimensionScoreSchema),
    screenshots: zod_1.z.array(zod_1.z.string().url()),
    screenshotAnalysis: analysis_1.ScreenshotAnalysisSchema.nullable(),
    competitorComparison: zod_1.z.array(exports.CompetitorComparisonRowSchema),
    quickWins: zod_1.z.array(recommendation_1.RecommendationSchema),
    highImpact: zod_1.z.array(recommendation_1.RecommendationSchema),
    strategic: zod_1.z.array(recommendation_1.RecommendationSchema),
    warnings: zod_1.z.array(zod_1.z.string()),
    generatedAt: zod_1.z.string(),
});
