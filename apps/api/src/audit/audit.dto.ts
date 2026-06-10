import { isAppStoreUrl } from "@aso/core";
import { z } from "zod";

const MAX_URL_LENGTH = 2048;


export const AuditRequestSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(MAX_URL_LENGTH, `URL must be at most ${MAX_URL_LENGTH} characters`)
    .url("Must be a valid URL")
    .refine(isAppStoreUrl, "Must be an Apple App Store app URL (apps.apple.com/.../idNNNNNN)"),
  refresh: z.boolean().default(false),
});
export type AuditRequest = z.infer<typeof AuditRequestSchema>;

export const AuditIdParamSchema = z.string().uuid("Invalid audit id");
export type AuditIdParam = z.infer<typeof AuditIdParamSchema>;
