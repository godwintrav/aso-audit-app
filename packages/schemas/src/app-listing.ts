import { z } from "zod";


export const ReviewSchema = z.object({
  title: z.string().optional(),
  body: z.string(),
  rating: z.number().min(0).max(5).optional(),
});
export type Review = z.infer<typeof ReviewSchema>;


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


  warnings: z.array(z.string()).default([]),
});
export type AppListing = z.infer<typeof AppListingSchema>;
