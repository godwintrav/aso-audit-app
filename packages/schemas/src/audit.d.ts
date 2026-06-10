import { z } from "zod";
export declare const AuditPreviewSchema: z.ZodObject<{
    appId: z.ZodString;
    country: z.ZodString;
    url: z.ZodString;
    title: z.ZodString;
    developer: z.ZodString;
    category: z.ZodString;
    iconUrl: z.ZodString;
}, z.core.$strip>;
export type AuditPreview = z.infer<typeof AuditPreviewSchema>;

export declare const AuditStageSchema: z.ZodEnum<{
    acquire_metadata: "acquire_metadata";
    analyze_metadata: "analyze_metadata";
    analyze_screenshots: "analyze_screenshots";
    analyze_reviews: "analyze_reviews";
    analyze_competitors: "analyze_competitors";
    generate_scores: "generate_scores";
    generate_recommendations: "generate_recommendations";
    assemble_report: "assemble_report";
}>;
export type AuditStage = z.infer<typeof AuditStageSchema>;
export declare const AuditStatusSchema: z.ZodEnum<{
    pending: "pending";
    running: "running";
    completed: "completed";
    failed: "failed";
}>;
export type AuditStatus = z.infer<typeof AuditStatusSchema>;
export declare const AuditProgressEventSchema: z.ZodObject<{
    auditId: z.ZodString;
    stage: z.ZodEnum<{
        acquire_metadata: "acquire_metadata";
        analyze_metadata: "analyze_metadata";
        analyze_screenshots: "analyze_screenshots";
        analyze_reviews: "analyze_reviews";
        analyze_competitors: "analyze_competitors";
        generate_scores: "generate_scores";
        generate_recommendations: "generate_recommendations";
        assemble_report: "assemble_report";
    }>;
    label: z.ZodString;
    status: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        started: "started";
    }>;
    message: z.ZodOptional<z.ZodString>;
    at: z.ZodString;
}, z.core.$strip>;
export type AuditProgressEvent = z.infer<typeof AuditProgressEventSchema>;
export declare const AuditRecordSchema: z.ZodObject<{
    auditId: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        running: "running";
        completed: "completed";
        failed: "failed";
    }>;
    preview: z.ZodNullable<z.ZodObject<{
        appId: z.ZodString;
        country: z.ZodString;
        url: z.ZodString;
        title: z.ZodString;
        developer: z.ZodString;
        category: z.ZodString;
        iconUrl: z.ZodString;
    }, z.core.$strip>>;
    progress: z.ZodArray<z.ZodObject<{
        auditId: z.ZodString;
        stage: z.ZodEnum<{
            acquire_metadata: "acquire_metadata";
            analyze_metadata: "analyze_metadata";
            analyze_screenshots: "analyze_screenshots";
            analyze_reviews: "analyze_reviews";
            analyze_competitors: "analyze_competitors";
            generate_scores: "generate_scores";
            generate_recommendations: "generate_recommendations";
            assemble_report: "assemble_report";
        }>;
        label: z.ZodString;
        status: z.ZodEnum<{
            completed: "completed";
            failed: "failed";
            started: "started";
        }>;
        message: z.ZodOptional<z.ZodString>;
        at: z.ZodString;
    }, z.core.$strip>>;
    report: z.ZodNullable<z.ZodObject<{
        appId: z.ZodString;
        app: z.ZodObject<{
            appId: z.ZodString;
            title: z.ZodString;
            subtitle: z.ZodOptional<z.ZodString>;
            developer: z.ZodString;
            category: z.ZodString;
            iconUrl: z.ZodString;
            rating: z.ZodNumber;
            ratingCount: z.ZodNumber;
        }, z.core.$strip>;
        overallScore: z.ZodNumber;
        dimensions: z.ZodArray<z.ZodObject<{
            dimension: z.ZodEnum<{
                title: "title";
                subtitle: "subtitle";
                description: "description";
                screenshots: "screenshots";
                keywordField: "keywordField";
                appPreviewVideo: "appPreviewVideo";
                ratingsAndReviews: "ratingsAndReviews";
                icon: "icon";
                conversionSignals: "conversionSignals";
                competitivePosition: "competitivePosition";
            }>;
            label: z.ZodString;
            weight: z.ZodNumber;
            score: z.ZodNumber;
            weightedScore: z.ZodNumber;
            summary: z.ZodString;
        }, z.core.$strip>>;
        screenshots: z.ZodArray<z.ZodString>;
        screenshotAnalysis: z.ZodNullable<z.ZodObject<{
            score: z.ZodNumber;
            strengths: z.ZodArray<z.ZodString>;
            weaknesses: z.ZodArray<z.ZodString>;
            recommendations: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
        competitorComparison: z.ZodArray<z.ZodObject<{
            competitor: z.ZodObject<{
                appId: z.ZodString;
                title: z.ZodString;
                developer: z.ZodOptional<z.ZodString>;
                category: z.ZodOptional<z.ZodString>;
                rating: z.ZodOptional<z.ZodNumber>;
                ratingCount: z.ZodOptional<z.ZodNumber>;
                iconUrl: z.ZodOptional<z.ZodString>;
                screenshotCount: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>;
            positioning: z.ZodString;
            metadataQuality: z.ZodEnum<{
                weaker: "weaker";
                comparable: "comparable";
                stronger: "stronger";
            }>;
            screenshotQuality: z.ZodEnum<{
                weaker: "weaker";
                comparable: "comparable";
                stronger: "stronger";
            }>;
        }, z.core.$strip>>;
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
        warnings: z.ZodArray<z.ZodString>;
        generatedAt: z.ZodString;
    }, z.core.$strip>>;
    error: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export type AuditRecord = z.infer<typeof AuditRecordSchema>;
