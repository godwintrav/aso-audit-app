import { z } from "zod";
/**
 * Schemas for the structured output of each analysis tool. These are the
 * contracts the LLM must satisfy — every model response is validated against
 * one of these before it is allowed into the system.
 */
/** A single observation produced by an analysis tool. */
export declare const FindingSchema: z.ZodObject<{
    label: z.ZodString;
    detail: z.ZodString;
    severity: z.ZodDefault<z.ZodEnum<{
        positive: "positive";
        info: "info";
        warning: "warning";
        critical: "critical";
    }>>;
}, z.core.$strip>;
export type Finding = z.infer<typeof FindingSchema>;
/** Shared shape for the text-metadata analyses (title / subtitle / description). */
export declare const TextAnalysisSchema: z.ZodObject<{
    score: z.ZodNumber;
    findings: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        detail: z.ZodString;
        severity: z.ZodDefault<z.ZodEnum<{
            positive: "positive";
            info: "info";
            warning: "warning";
            critical: "critical";
        }>>;
    }, z.core.$strip>>;
    recommendations: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type TextAnalysis = z.infer<typeof TextAnalysisSchema>;
export declare const TitleAnalysisSchema: z.ZodObject<{
    score: z.ZodNumber;
    findings: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        detail: z.ZodString;
        severity: z.ZodDefault<z.ZodEnum<{
            positive: "positive";
            info: "info";
            warning: "warning";
            critical: "critical";
        }>>;
    }, z.core.$strip>>;
    recommendations: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type TitleAnalysis = z.infer<typeof TitleAnalysisSchema>;
export declare const SubtitleAnalysisSchema: z.ZodObject<{
    score: z.ZodNumber;
    findings: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        detail: z.ZodString;
        severity: z.ZodDefault<z.ZodEnum<{
            positive: "positive";
            info: "info";
            warning: "warning";
            critical: "critical";
        }>>;
    }, z.core.$strip>>;
    recommendations: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type SubtitleAnalysis = z.infer<typeof SubtitleAnalysisSchema>;
export declare const DescriptionAnalysisSchema: z.ZodObject<{
    score: z.ZodNumber;
    findings: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        detail: z.ZodString;
        severity: z.ZodDefault<z.ZodEnum<{
            positive: "positive";
            info: "info";
            warning: "warning";
            critical: "critical";
        }>>;
    }, z.core.$strip>>;
    recommendations: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type DescriptionAnalysis = z.infer<typeof DescriptionAnalysisSchema>;
/** Vision analysis of the screenshot gallery (GPT-4o vision). */
export declare const ScreenshotAnalysisSchema: z.ZodObject<{
    score: z.ZodNumber;
    strengths: z.ZodArray<z.ZodString>;
    weaknesses: z.ZodArray<z.ZodString>;
    recommendations: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type ScreenshotAnalysis = z.infer<typeof ScreenshotAnalysisSchema>;
/** Sentiment + theme analysis of user reviews. */
export declare const ReviewAnalysisSchema: z.ZodObject<{
    score: z.ZodNumber;
    sentiment: z.ZodEnum<{
        positive: "positive";
        mixed: "mixed";
        negative: "negative";
    }>;
    positiveThemes: z.ZodArray<z.ZodString>;
    complaintThemes: z.ZodArray<z.ZodString>;
    trustIndicators: z.ZodArray<z.ZodString>;
    recommendations: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type ReviewAnalysis = z.infer<typeof ReviewAnalysisSchema>;
/** Competitive positioning analysis. */
export declare const CompetitorAnalysisSchema: z.ZodObject<{
    score: z.ZodNumber;
    strengths: z.ZodArray<z.ZodString>;
    weaknesses: z.ZodArray<z.ZodString>;
    opportunities: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type CompetitorAnalysis = z.infer<typeof CompetitorAnalysisSchema>;
/**
 * The bundle of analysis results produced by the parallel stage of the
 * workflow. Optional fields degrade gracefully when source data is missing.
 */
export declare const AnalysisBundleSchema: z.ZodObject<{
    title: z.ZodObject<{
        score: z.ZodNumber;
        findings: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            detail: z.ZodString;
            severity: z.ZodDefault<z.ZodEnum<{
                positive: "positive";
                info: "info";
                warning: "warning";
                critical: "critical";
            }>>;
        }, z.core.$strip>>;
        recommendations: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    subtitle: z.ZodNullable<z.ZodObject<{
        score: z.ZodNumber;
        findings: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            detail: z.ZodString;
            severity: z.ZodDefault<z.ZodEnum<{
                positive: "positive";
                info: "info";
                warning: "warning";
                critical: "critical";
            }>>;
        }, z.core.$strip>>;
        recommendations: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    description: z.ZodObject<{
        score: z.ZodNumber;
        findings: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            detail: z.ZodString;
            severity: z.ZodDefault<z.ZodEnum<{
                positive: "positive";
                info: "info";
                warning: "warning";
                critical: "critical";
            }>>;
        }, z.core.$strip>>;
        recommendations: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    screenshots: z.ZodNullable<z.ZodObject<{
        score: z.ZodNumber;
        strengths: z.ZodArray<z.ZodString>;
        weaknesses: z.ZodArray<z.ZodString>;
        recommendations: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    reviews: z.ZodNullable<z.ZodObject<{
        score: z.ZodNumber;
        sentiment: z.ZodEnum<{
            positive: "positive";
            mixed: "mixed";
            negative: "negative";
        }>;
        positiveThemes: z.ZodArray<z.ZodString>;
        complaintThemes: z.ZodArray<z.ZodString>;
        trustIndicators: z.ZodArray<z.ZodString>;
        recommendations: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    competitors: z.ZodNullable<z.ZodObject<{
        score: z.ZodNumber;
        strengths: z.ZodArray<z.ZodString>;
        weaknesses: z.ZodArray<z.ZodString>;
        opportunities: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type AnalysisBundle = z.infer<typeof AnalysisBundleSchema>;
