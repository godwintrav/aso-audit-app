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

/**
 * The ASO audit workflow.
 *
 *   ┌─ analyze metadata (title + subtitle + description)
 *   ├─ analyze screenshots (vision)        run concurrently
 *   ├─ analyze reviews
 *   └─ analyze competitors
 *            ↓
 *      generate scores
 *            ↓
 *      generate recommendations
 *            ↓
 *      assemble report
 *
 * The four analysis stages are independent and execute in parallel, after
 * which scoring, recommendations and assembly run in sequence.
 */
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
