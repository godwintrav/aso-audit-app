import type { AnalysisGateway } from "@aso/agents";
import type {
  AppListing,
  AuditReport,
  AuditStage,
  DimensionScore,
  RecommendationSet,
} from "@aso/schemas";
import type { AnalysisResults } from "./types";

export type ProgressStatus = "started" | "completed" | "failed";

export type ProgressEmitter = (
  stage: AuditStage,
  status: ProgressStatus,
  message?: string,
) => void;

/**
 * Run-scoped state shared across workflow steps via Mastra's RuntimeContext.
 * It carries the injected dependencies (gateway, progress emitter), the input
 * listing, and a mutable accumulator the steps write their results into.
 *
 * Threading run-wide dependencies and accumulating state through the runtime
 * context — rather than the per-step data channel — keeps each step a thin,
 * order-independent transform and makes progress + graceful degradation easy.
 */
export interface AuditRunContext {
  listing: AppListing;
  gateway: AnalysisGateway;
  emit: ProgressEmitter;
  results: AnalysisResults;
  dimensions: DimensionScore[] | null;
  recommendations: RecommendationSet | null;
  report: AuditReport | null;
}

/** The single RuntimeContext key under which the audit context is stored. */
export const AUDIT_CONTEXT_KEY = "auditContext";

export function createRunContext(input: {
  listing: AppListing;
  gateway: AnalysisGateway;
  emit?: ProgressEmitter;
}): AuditRunContext {
  return {
    listing: input.listing,
    gateway: input.gateway,
    emit: input.emit ?? (() => {}),
    results: {
      title: null,
      subtitle: null,
      description: null,
      screenshots: null,
      reviews: null,
      competitors: null,
    },
    dimensions: null,
    recommendations: null,
    report: null,
  };
}
