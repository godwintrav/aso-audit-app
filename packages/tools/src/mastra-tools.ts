import { createTool } from "@mastra/core/tools";
import type { RuntimeContext } from "@mastra/core/runtime-context";
import type { AnalysisGateway } from "@aso/agents";
import {
  CompetitorAnalysisSchema,
  CompetitorSchema,
  DescriptionAnalysisSchema,
  DimensionScoreSchema,
  AppListingSchema,
  RecommendationSetSchema,
  ReviewAnalysisSchema,
  ReviewSchema,
  ScreenshotAnalysisSchema,
  SubtitleAnalysisSchema,
  TitleAnalysisSchema,
} from "@aso/schemas";
import { z } from "zod";
import {
  analyzeCompetitors,
  analyzeDescription,
  analyzeReviews,
  analyzeScreenshots,
  analyzeSubtitle,
  analyzeTitle,
  generateRecommendations,
} from "./analyzers";


export const ANALYSIS_GATEWAY_KEY = "analysisGateway";

export function resolveGateway(runtimeContext: RuntimeContext): AnalysisGateway {
  const gateway = runtimeContext.get(ANALYSIS_GATEWAY_KEY) as
    | AnalysisGateway
    | undefined;
  if (!gateway) {
    throw new Error(
      `No AnalysisGateway found on runtimeContext["${ANALYSIS_GATEWAY_KEY}"].`,
    );
  }
  return gateway;
}


export const titleTool = createTool({
  id: "analyze-title",
  description: "Analyze the app title for ASO quality.",
  inputSchema: z.object({ title: z.string(), category: z.string() }),
  outputSchema: TitleAnalysisSchema,
  execute: async ({ context, runtimeContext }) =>
    analyzeTitle(resolveGateway(runtimeContext), context),
});

export const subtitleTool = createTool({
  id: "analyze-subtitle",
  description: "Analyze the app subtitle for ASO quality.",
  inputSchema: z.object({ title: z.string(), subtitle: z.string() }),
  outputSchema: SubtitleAnalysisSchema,
  execute: async ({ context, runtimeContext }) =>
    analyzeSubtitle(resolveGateway(runtimeContext), context),
});

export const descriptionTool = createTool({
  id: "analyze-description",
  description: "Analyze the app description for ASO quality.",
  inputSchema: z.object({ description: z.string() }),
  outputSchema: DescriptionAnalysisSchema,
  execute: async ({ context, runtimeContext }) =>
    analyzeDescription(resolveGateway(runtimeContext), context),
});

export const screenshotTool = createTool({
  id: "analyze-screenshots",
  description: "Analyze the app screenshot gallery with a vision model.",
  inputSchema: z.object({ screenshots: z.array(z.string().url()) }),
  outputSchema: ScreenshotAnalysisSchema,
  execute: async ({ context, runtimeContext }) =>
    analyzeScreenshots(resolveGateway(runtimeContext), context),
});

export const reviewTool = createTool({
  id: "analyze-reviews",
  description: "Analyze user reviews for sentiment and themes.",
  inputSchema: z.object({
    reviews: z.array(ReviewSchema),
    rating: z.number(),
    ratingCount: z.number(),
  }),
  outputSchema: ReviewAnalysisSchema,
  execute: async ({ context, runtimeContext }) =>
    analyzeReviews(resolveGateway(runtimeContext), context),
});

export const competitorTool = createTool({
  id: "analyze-competitors",
  description: "Compare the app against competitors.",
  inputSchema: z.object({
    app: z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      category: z.string(),
      rating: z.number(),
      ratingCount: z.number(),
    }),
    competitors: z.array(CompetitorSchema),
  }),
  outputSchema: CompetitorAnalysisSchema,
  execute: async ({ context, runtimeContext }) =>
    analyzeCompetitors(resolveGateway(runtimeContext), context),
});

export const recommendationTool = createTool({
  id: "generate-recommendations",
  description: "Generate prioritized, evidence-driven ASO recommendations.",
  inputSchema: z.object({
    listing: AppListingSchema,
    dimensions: z.array(DimensionScoreSchema),
    analysisSummary: z.string(),
  }),
  outputSchema: RecommendationSetSchema,
  execute: async ({ context, runtimeContext }) =>
    generateRecommendations(resolveGateway(runtimeContext), context),
});

export const analysisTools = {
  titleTool,
  subtitleTool,
  descriptionTool,
  screenshotTool,
  reviewTool,
  competitorTool,
  recommendationTool,
};
