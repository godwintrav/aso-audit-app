import { isAppStoreUrl } from "@aso/core";
import { z } from "zod";

/** Upper bound on URL length — generous, but guards against abusive payloads. */
const MAX_URL_LENGTH = 2048;

/** Request body for both /audit/preview and /audit/run. */
export const AuditRequestSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(MAX_URL_LENGTH, `URL must be at most ${MAX_URL_LENGTH} characters`)
    .url("Must be a valid URL")
    .refine(isAppStoreUrl, "Must be an Apple App Store app URL (apps.apple.com/.../idNNNNNN)"),
  /** When true, bypass and overwrite any cached result for this app. */
  refresh: z.boolean().default(false),
});
export type AuditRequest = z.infer<typeof AuditRequestSchema>;

/** Path-param DTO for the audit id (generated via crypto.randomUUID). */
export const AuditIdParamSchema = z.string().uuid("Invalid audit id");
export type AuditIdParam = z.infer<typeof AuditIdParamSchema>;
