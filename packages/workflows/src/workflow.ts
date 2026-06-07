import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
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
  inputSchema: z.object({}),
  outputSchema: z.object({}),
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
