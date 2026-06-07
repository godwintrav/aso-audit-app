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

export interface AuditRunContext {
  listing: AppListing;
  gateway: AnalysisGateway;
  emit: ProgressEmitter;
  results: AnalysisResults;
  dimensions: DimensionScore[] | null;
  recommendations: RecommendationSet | null;
  report: AuditReport | null;
}

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
