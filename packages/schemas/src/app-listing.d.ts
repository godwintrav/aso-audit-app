import { z } from "zod";
/**
 * A single user review, normalized from the Firecrawl App Store markdown.
 */
export declare const ReviewSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    body: z.ZodString;
    rating: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type Review = z.infer<typeof ReviewSchema>;
/**
 * A competitor app surfaced from the "You Might Also Like" section and
 * enriched with metadata from the iTunes Lookup API.
 */
export declare const CompetitorSchema: z.ZodObject<{
    appId: z.ZodString;
    title: z.ZodString;
    developer: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    rating: z.ZodOptional<z.ZodNumber>;
    ratingCount: z.ZodOptional<z.ZodNumber>;
    iconUrl: z.ZodOptional<z.ZodString>;
    screenshotCount: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type Competitor = z.infer<typeof CompetitorSchema>;
/**
 * The unified internal domain model. Every downstream system (workflow,
 * tools, API responses) consumes this — never a raw Apple or Firecrawl shape.
 */
export declare const AppListingSchema: z.ZodObject<{
    appId: z.ZodString;
    country: z.ZodString;
    url: z.ZodString;
    title: z.ZodString;
    subtitle: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    developer: z.ZodString;
    category: z.ZodString;
    iconUrl: z.ZodString;
    rating: z.ZodNumber;
    ratingCount: z.ZodNumber;
    version: z.ZodOptional<z.ZodString>;
    whatsNew: z.ZodOptional<z.ZodString>;
    hasAppPreviewVideo: z.ZodDefault<z.ZodBoolean>;
    screenshots: z.ZodArray<z.ZodString>;
    reviews: z.ZodArray<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        body: z.ZodString;
        rating: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    competitors: z.ZodArray<z.ZodObject<{
        appId: z.ZodString;
        title: z.ZodString;
        developer: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        rating: z.ZodOptional<z.ZodNumber>;
        ratingCount: z.ZodOptional<z.ZodNumber>;
        iconUrl: z.ZodOptional<z.ZodString>;
        screenshotCount: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    warnings: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type AppListing = z.infer<typeof AppListingSchema>;
