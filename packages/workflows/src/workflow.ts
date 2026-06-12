import { createWorkflow } from "@mastra/core/workflows";
import { AppListingSchema, AuditReportSchema } from "@aso/schemas";
import {
  analyzeCompetitorsStep,
  analyzeMetadataStep,
  analyzeReviewsStep,
  analyzeScreenshotsStep,
  assembleReportStep,
  generateRecommendationsStep,
  generateScoresStep,
} from "./steps";


export const asoAuditWorkflow = createWorkflow({
  id: "aso-audit",
  inputSchema: AppListingSchema,
  outputSchema: AuditReportSchema,
})
  .parallel([
    analyzeMetadataStep,
    analyzeScreenshotsStep,
    analyzeReviewsStep,
    analyzeCompetitorsStep,
  ])
  .then(generateScoresStep)
  .then(generateRecommendationsStep)
  .then(assembleReportStep)
  .commit();
