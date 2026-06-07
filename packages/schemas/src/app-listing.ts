import { z } from "zod";

/**
 * A single user review, normalized from the Firecrawl App Store markdown.
 */
export const ReviewSchema = z.object({
  title: z.string().optional(),
  body: z.string(),
  rating: z.number().min(0).max(5).optional(),
});
export type Review = z.infer<typeof ReviewSchema>;

/**
 * A competitor app surfaced from the "You Might Also Like" section and
 * enriched with metadata from the iTunes Lookup API.
 */
export const CompetitorSchema = z.object({
  appId: z.string(),
  title: z.string(),
  developer: z.string().optional(),
  category: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  ratingCount: z.number().int().nonnegative().optional(),
  iconUrl: z.string().url().optional(),
  screenshotCount: z.number().int().nonnegative().optional(),
});
export type Competitor = z.infer<typeof CompetitorSchema>;

/**
 * The unified internal domain model. Every downstream system (workflow,
 * tools, API responses) consumes this — never a raw Apple or Firecrawl shape.
 */
export const AppListingSchema = z.object({
  appId: z.string(),
  country: z.string(),
  url: z.string().url(),

  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string(),
  developer: z.string(),
  category: z.string(),
  iconUrl: z.string().url(),

  rating: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),

  version: z.string().optional(),
  whatsNew: z.string().optional(),

  hasAppPreviewVideo: z.boolean().default(false),

  screenshots: z.array(z.string().url()),
  reviews: z.array(ReviewSchema),
  competitors: z.array(CompetitorSchema),

  /**
   * Non-fatal issues encountered while acquiring data (e.g. Firecrawl failed,
   * so reviews/subtitle/competitors are missing). Surfaced in the report so
   * the user understands why a dimension may be scored conservatively.
   */
  warnings: z.array(z.string()).default([]),
});
export type AppListing = z.infer<typeof AppListingSchema>;
