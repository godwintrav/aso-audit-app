"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditRecordSchema = exports.AuditProgressEventSchema = exports.AuditStatusSchema = exports.AuditStageSchema = exports.AuditPreviewSchema = void 0;
const zod_1 = require("zod");
const report_1 = require("./report");
/** Returned by POST /audit/preview — the data for the confirmation card. */
exports.AuditPreviewSchema = zod_1.z.object({
    appId: zod_1.z.string(),
    country: zod_1.z.string(),
    url: zod_1.z.string().url(),
    title: zod_1.z.string(),
    developer: zod_1.z.string(),
    category: zod_1.z.string(),
    iconUrl: zod_1.z.string().url(),
});
/** The canonical, ordered stages of an audit run (acquisition + workflow). */
exports.AuditStageSchema = zod_1.z.enum([
    "acquire_metadata",
    "analyze_metadata",
    "analyze_screenshots",
    "analyze_reviews",
    "analyze_competitors",
    "generate_scores",
    "generate_recommendations",
    "assemble_report",
]);
exports.AuditStatusSchema = zod_1.z.enum([
    "pending",
    "running",
    "completed",
    "failed",
]);
/** A single progress event streamed over SSE. */
exports.AuditProgressEventSchema = zod_1.z.object({
    auditId: zod_1.z.string(),
    stage: exports.AuditStageSchema,
    label: zod_1.z.string(),
    status: zod_1.z.enum(["started", "completed", "failed"]),
    message: zod_1.z.string().optional(),
    at: zod_1.z.string(),
});
/** The full state of an audit, held in the AuditStore and exposed via GET /audit/:id. */
exports.AuditRecordSchema = zod_1.z.object({
    auditId: zod_1.z.string(),
    status: exports.AuditStatusSchema,
    preview: exports.AuditPreviewSchema.nullable(),
    progress: zod_1.z.array(exports.AuditProgressEventSchema),
    report: report_1.AuditReportSchema.nullable(),
    error: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
//# sourceMappingURL=audit.js.map