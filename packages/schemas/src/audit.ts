import { z } from "zod";
import { AuditReportSchema } from "./report";

/** Returned by POST /audit/preview — the data for the confirmation card. */
export const AuditPreviewSchema = z.object({
  appId: z.string(),
  country: z.string(),
  url: z.string().url(),
  title: z.string(),
  developer: z.string(),
  category: z.string(),
  iconUrl: z.string().url(),
});
export type AuditPreview = z.infer<typeof AuditPreviewSchema>;

/** The canonical, ordered stages of an audit run (acquisition + workflow). */
export const AuditStageSchema = z.enum([
  "acquire_metadata",
  "analyze_metadata",
  "analyze_screenshots",
  "analyze_reviews",
  "analyze_competitors",
  "generate_scores",
  "generate_recommendations",
  "assemble_report",
]);
export type AuditStage = z.infer<typeof AuditStageSchema>;

export const AuditStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
]);
export type AuditStatus = z.infer<typeof AuditStatusSchema>;

/** A single progress event streamed over SSE. */
export const AuditProgressEventSchema = z.object({
  auditId: z.string(),
  stage: AuditStageSchema,
  label: z.string(),
  status: z.enum(["started", "completed", "failed"]),
  message: z.string().optional(),
  at: z.string(),
});
export type AuditProgressEvent = z.infer<typeof AuditProgressEventSchema>;

/** The full state of an audit, held in the AuditStore and exposed via GET /audit/:id. */
export const AuditRecordSchema = z.object({
  auditId: z.string(),
  status: AuditStatusSchema,
  preview: AuditPreviewSchema.nullable(),
  progress: z.array(AuditProgressEventSchema),
  report: AuditReportSchema.nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AuditRecord = z.infer<typeof AuditRecordSchema>;
