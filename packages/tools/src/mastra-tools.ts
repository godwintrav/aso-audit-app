import { createTool } from "@mastra/core/tools";
import type { AnalysisGateway } from "@aso/agents";
import {
  CompetitorAnalysisSchema,
  CompetitorSchema,
  DescriptionAnalysisSchema,
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
} from "./analyzers";

/**
 * Mastra tool definitions, one per analysis dimension. Each is a thin,
 * declarative wrapper (id + input/output schema + execute) over the pure
 * analyzer functions, closing over the injected gateway. Keeping them small
 * and specialized — rather than one giant prompt — is the core of the design.
 */
export function createAnalysisTools(gateway: AnalysisGateway) {
  const titleTool = createTool({
    id: "analyze-title",
    description: "Analyze the app title for ASO quality.",
    inputSchema: z.object({ title: z.string(), category: z.string() }),
    outputSchema: TitleAnalysisSchema,
    execute: async ({ context }) => analyzeTitle(gateway, context),
  });

  const subtitleTool = createTool({
    id: "analyze-subtitle",
    description: "Analyze the app subtitle for ASO quality.",
    inputSchema: z.object({ title: z.string(), subtitle: z.string() }),
    outputSchema: SubtitleAnalysisSchema,
    execute: async ({ context }) => analyzeSubtitle(gateway, context),
  });

  const descriptionTool = createTool({
    id: "analyze-description",
    description: "Analyze the app description for ASO quality.",
    inputSchema: z.object({ description: z.string() }),
    outputSchema: DescriptionAnalysisSchema,
    execute: async ({ context }) => analyzeDescription(gateway, context),
  });

  const screenshotTool = createTool({
    id: "analyze-screenshots",
    description: "Analyze the app screenshot gallery with a vision model.",
    inputSchema: z.object({ screenshots: z.array(z.string().url()) }),
    outputSchema: ScreenshotAnalysisSchema,
    execute: async ({ context }) => analyzeScreenshots(gateway, context),
  });

  const reviewTool = createTool({
    id: "analyze-reviews",
    description: "Analyze user reviews for sentiment and themes.",
    inputSchema: z.object({
      reviews: z.array(ReviewSchema),
      rating: z.number(),
      ratingCount: z.number(),
    }),
    outputSchema: ReviewAnalysisSchema,
    execute: async ({ context }) => analyzeReviews(gateway, context),
  });

  const competitorTool = createTool({
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
    execute: async ({ context }) => analyzeCompetitors(gateway, context),
  });

  return {
    titleTool,
    subtitleTool,
    descriptionTool,
    screenshotTool,
    reviewTool,
    competitorTool,
  };
}

export type AnalysisTools = ReturnType<typeof createAnalysisTools>;
