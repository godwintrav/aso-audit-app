import { z } from "zod";
/**
 * The ten ASO scoring dimensions. Kept here (next to the schema that uses
 * them) so the schema package stays self-contained; weights live in @aso/core.
 */
export declare const DimensionKeySchema: z.ZodEnum<{
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
export type DimensionKey = z.infer<typeof DimensionKeySchema>;
export declare const DimensionScoreSchema: z.ZodObject<{
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
}, z.core.$strip>;
export type DimensionScore = z.infer<typeof DimensionScoreSchema>;
