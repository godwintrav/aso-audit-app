import { z } from "zod";
export declare const RecommendationCategorySchema: z.ZodEnum<{
    quick_win: "quick_win";
    high_impact: "high_impact";
    strategic: "strategic";
}>;
export type RecommendationCategory = z.infer<typeof RecommendationCategorySchema>;
export declare const EffortLevelSchema: z.ZodEnum<{
    low: "low";
    medium: "medium";
    high: "high";
}>;
export declare const ImpactLevelSchema: z.ZodEnum<{
    low: "low";
    medium: "medium";
    high: "high";
}>;
export declare const RecommendationSchema: z.ZodObject<{
    category: z.ZodEnum<{
        quick_win: "quick_win";
        high_impact: "high_impact";
        strategic: "strategic";
    }>;
    title: z.ZodString;
    evidence: z.ZodString;
    reason: z.ZodString;
    impact: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>;
    effort: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>;
    before: z.ZodOptional<z.ZodString>;
    after: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export declare const RecommendationSetSchema: z.ZodObject<{
    quickWins: z.ZodArray<z.ZodObject<{
        category: z.ZodEnum<{
            quick_win: "quick_win";
            high_impact: "high_impact";
            strategic: "strategic";
        }>;
        title: z.ZodString;
        evidence: z.ZodString;
        reason: z.ZodString;
        impact: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
        }>;
        effort: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
        }>;
        before: z.ZodOptional<z.ZodString>;
        after: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    highImpact: z.ZodArray<z.ZodObject<{
        category: z.ZodEnum<{
            quick_win: "quick_win";
            high_impact: "high_impact";
            strategic: "strategic";
        }>;
        title: z.ZodString;
        evidence: z.ZodString;
        reason: z.ZodString;
        impact: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
        }>;
        effort: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
        }>;
        before: z.ZodOptional<z.ZodString>;
        after: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    strategic: z.ZodArray<z.ZodObject<{
        category: z.ZodEnum<{
            quick_win: "quick_win";
            high_impact: "high_impact";
            strategic: "strategic";
        }>;
        title: z.ZodString;
        evidence: z.ZodString;
        reason: z.ZodString;
        impact: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
        }>;
        effort: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
        }>;
        before: z.ZodOptional<z.ZodString>;
        after: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type RecommendationSet = z.infer<typeof RecommendationSetSchema>;
