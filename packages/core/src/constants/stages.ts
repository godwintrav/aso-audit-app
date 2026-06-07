import type { AuditStage } from "@aso/schemas";

/** Human-readable label for each audit stage, shown in the progress stream. */
export const STAGE_LABELS: Record<AuditStage, string> = {
  acquire_metadata: "Fetching app metadata",
  analyze_metadata: "Analyzing title, subtitle & description",
  analyze_screenshots: "Analyzing screenshots",
  analyze_reviews: "Analyzing reviews",
  analyze_competitors: "Finding competitors",
  generate_scores: "Generating scores",
  generate_recommendations: "Generating recommendations",
  assemble_report: "Building report",
};

/** The canonical ordered list of stages a full audit moves through. */
export const AUDIT_STAGES: readonly AuditStage[] = [
  "acquire_metadata",
  "analyze_metadata",
  "analyze_screenshots",
  "analyze_reviews",
  "analyze_competitors",
  "generate_scores",
  "generate_recommendations",
  "assemble_report",
];
