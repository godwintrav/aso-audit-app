import { z } from "zod";

/**
 * Schema for a single item from the iTunes Lookup/Search API. We validate the
 * fields we consume and ignore the rest; an invalid shape is rejected at the
 * boundary so raw Apple responses never flow into the domain.
 */
export const AppleLookupItemSchema = z.object({
  trackId: z.number(),
  trackName: z.string(),
  description: z.string().default(""),
  artistName: z.string().default("Unknown developer"),
  primaryGenreName: z.string().default("Unknown"),
  artworkUrl512: z.string().url().optional(),
  artworkUrl100: z.string().url().optional(),
  artworkUrl60: z.string().url().optional(),
  screenshotUrls: z.array(z.string().url()).default([]),
  ipadScreenshotUrls: z.array(z.string().url()).default([]),
  averageUserRating: z.number().default(0),
  userRatingCount: z.number().int().nonnegative().default(0),
  version: z.string().optional(),
  releaseNotes: z.string().optional(),
  trackViewUrl: z.string().url().optional(),
});
export type AppleLookupItem = z.infer<typeof AppleLookupItemSchema>;

export const AppleLookupResponseSchema = z.object({
  resultCount: z.number(),
  results: z.array(z.unknown()),
});
