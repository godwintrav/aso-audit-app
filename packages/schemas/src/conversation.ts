import { z } from "zod";
import { AuditPreviewSchema, AuditStatusSchema } from "./audit";
import { AuditReportSchema } from "./report";

/**
 * A persisted audit "conversation" — the durable, session-scoped projection of
 * one audit run. The chat UI derives its message bubbles from these fields
 * (user URL → confirmation preview → streamed report), so there is no separate
 * message log to store. `id` equals the run's `auditId` (one audit = one thread).
 */
export const ConversationSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  url: z.string(),
  title: z.string(),
  status: AuditStatusSchema,
  preview: AuditPreviewSchema.nullable(),
  report: AuditReportSchema.nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

/** Lightweight row for the sidebar list — never exposes `sessionId` to the client. */
export const ConversationSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  status: AuditStatusSchema,
  iconUrl: z.string().url().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ConversationSummary = z.infer<typeof ConversationSummarySchema>;
