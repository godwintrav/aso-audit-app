import { z } from "zod";
import { AuditPreviewSchema, AuditStatusSchema } from "./audit";
import { AuditReportSchema } from "./report";

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

export const ConversationSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  status: AuditStatusSchema,
  iconUrl: z.string().url().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ConversationSummary = z.infer<typeof ConversationSummarySchema>;
