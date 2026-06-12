import { createStep } from "@mastra/core/workflows";
import {
  competitorTool,
  descriptionTool,
  recommendationTool,
  reviewTool,
  screenshotTool,
  subtitleTool,
  titleTool,
} from "@aso/tools";
import {
  AppListingSchema,
  CompetitorAnalysisSchema,
  DescriptionAnalysisSchema,
  DimensionScoreSchema,
  RecommendationSetSchema,
  AuditReportSchema,
  ReviewAnalysisSchema,
  ScreenshotAnalysisSchema,
  SubtitleAnalysisSchema,
  TitleAnalysisSchema,
} from "@aso/schemas";
import { z } from "zod";
import { resolveEmit } from "./context";
import { assembleReport } from "./assemble";
import { scoreDimensions } from "./scoring";
import { summarizeAnalyses } from "./summary";
import type { AnalysisResults } from "./types";


const MetadataResultSchema = z.object({
  title: TitleAnalysisSchema.nullable(),
  subtitle: SubtitleAnalysisSchema.nullable(),
  description: DescriptionAnalysisSchema.nullable(),
});

const AnalysisStageSchema = z.object({
  "analyze-metadata": MetadataResultSchema,
  "analyze-screenshots": ScreenshotAnalysisSchema.nullable(),
  "analyze-reviews": ReviewAnalysisSchema.nullable(),
  "analyze-competitors": CompetitorAnalysisSchema.nullable(),
});

const ResultsSchema = z.object({
  title: TitleAnalysisSchema.nullable(),
  subtitle: SubtitleAnalysisSchema.nullable(),
  description: DescriptionAnalysisSchema.nullable(),
  screenshots: ScreenshotAnalysisSchema.nullable(),
  reviews: ReviewAnalysisSchema.nullable(),
  competitors: CompetitorAnalysisSchema.nullable(),
});

const ScoresStageSchema = z.object({
  results: ResultsSchema,
  dimensions: z.array(DimensionScoreSchema),
});

const RecommendStageSchema = ScoresStageSchema.extend({
  recommendations: RecommendationSetSchema,
  warnings: z.array(z.string()),
});

async function safe<T>(run: () => Promise<T>, onFail: (msg: string) => void): Promise<T | null> {
  try {
    return await run();
  } catch (error) {
    onFail(error instanceof Error ? error.message : String(error));
    return null;
  }
}

export const analyzeMetadataStep = createStep({
  id: "analyze-metadata",
  inputSchema: AppListingSchema,
  outputSchema: MetadataResultSchema,
  execute: async ({ inputData: listing, runtimeContext }) => {
    const emit = resolveEmit(runtimeContext);
    emit("analyze_metadata", "started");

    const [title, subtitle, description] = await Promise.all([
      safe(
        () => titleTool.execute({
          context: { title: listing.title, category: listing.category },
          runtimeContext,
        }),
        () => {},
      ),
      listing.subtitle
        ? safe(
            () => subtitleTool.execute({
              context: { title: listing.title, subtitle: listing.subtitle as string },
              runtimeContext,
            }),
            () => {},
          )
        : Promise.resolve(null),
      safe(
        () => descriptionTool.execute({
          context: { description: listing.description },
          runtimeContext,
        }),
        () => {},
      ),
    ]);

    emit("analyze_metadata", "completed");
    return { title, subtitle, description };
  },
});

export const analyzeScreenshotsStep = createStep({
  id: "analyze-screenshots",
  inputSchema: AppListingSchema,
  outputSchema: ScreenshotAnalysisSchema.nullable(),
  execute: async ({ inputData: listing, runtimeContext }) => {
    const emit = resolveEmit(runtimeContext);
    emit("analyze_screenshots", "started");
    if (listing.screenshots.length === 0) {
      emit("analyze_screenshots", "completed", "No screenshots available.");
      return null;
    }
    const result = await safe(
      () => screenshotTool.execute({
        context: { screenshots: listing.screenshots },
        runtimeContext,
      }),
      (msg) => emit("analyze_screenshots", "failed", msg),
    );
    if (result) emit("analyze_screenshots", "completed");
    return result;
  },
});

export const analyzeReviewsStep = createStep({
  id: "analyze-reviews",
  inputSchema: AppListingSchema,
  outputSchema: ReviewAnalysisSchema.nullable(),
  execute: async ({ inputData: listing, runtimeContext }) => {
    const emit = resolveEmit(runtimeContext);
    emit("analyze_reviews", "started");
    if (listing.reviews.length === 0) {
      emit("analyze_reviews", "completed", "No reviews available.");
      return null;
    }
    const result = await safe(
      () => reviewTool.execute({
        context: {
          reviews: listing.reviews,
          rating: listing.rating,
          ratingCount: listing.ratingCount,
        },
        runtimeContext,
      }),
      (msg) => emit("analyze_reviews", "failed", msg),
    );
    if (result) emit("analyze_reviews", "completed");
    return result;
  },
});

export const analyzeCompetitorsStep = createStep({
  id: "analyze-competitors",
  inputSchema: AppListingSchema,
  outputSchema: CompetitorAnalysisSchema.nullable(),
  execute: async ({ inputData: listing, runtimeContext }) => {
    const emit = resolveEmit(runtimeContext);
    emit("analyze_competitors", "started");
    if (listing.competitors.length === 0) {
      emit("analyze_competitors", "completed", "No competitors found.");
      return null;
    }
    const result = await safe(
      () => competitorTool.execute({
        context: {
          app: {
            title: listing.title,
            subtitle: listing.subtitle,
            category: listing.category,
            rating: listing.rating,
            ratingCount: listing.ratingCount,
          },
          competitors: listing.competitors,
        },
        runtimeContext,
      }),
      (msg) => emit("analyze_competitors", "failed", msg),
    );
    if (result) emit("analyze_competitors", "completed");
    return result;
  },
});

export const generateScoresStep = createStep({
  id: "generate-scores",
  inputSchema: AnalysisStageSchema,
  outputSchema: ScoresStageSchema,
  execute: async ({ inputData, getInitData, runtimeContext }) => {
    const emit = resolveEmit(runtimeContext);
    emit("generate_scores", "started");
    const listing = getInitData<typeof AppListingSchema>();
    const results: AnalysisResults = {
      title: inputData["analyze-metadata"].title,
      subtitle: inputData["analyze-metadata"].subtitle,
      description: inputData["analyze-metadata"].description,
      screenshots: inputData["analyze-screenshots"],
      reviews: inputData["analyze-reviews"],
      competitors: inputData["analyze-competitors"],
    };
    const dimensions = scoreDimensions(listing, results);
    emit("generate_scores", "completed");
    return { results, dimensions };
  },
});

export const generateRecommendationsStep = createStep({
  id: "generate-recommendations",
  inputSchema: ScoresStageSchema,
  outputSchema: RecommendStageSchema,
  execute: async ({ inputData, getInitData, runtimeContext }) => {
    const emit = resolveEmit(runtimeContext);
    emit("generate_recommendations", "started");
    const listing = getInitData<typeof AppListingSchema>();
    const warnings: string[] = [];

    const recommendations = await safe(
      () => recommendationTool.execute({
        context: {
          listing,
          dimensions: inputData.dimensions,
          analysisSummary: summarizeAnalyses(inputData.results),
        },
        runtimeContext,
      }),
      (msg) => {
        warnings.push("Recommendation generation failed; report omits suggestions.");
        emit("generate_recommendations", "failed", msg);
      },
    );

    if (recommendations) emit("generate_recommendations", "completed");
    return {
      ...inputData,
      recommendations: recommendations ?? { quickWins: [], highImpact: [], strategic: [] },
      warnings,
    };
  },
});

export const assembleReportStep = createStep({
  id: "assemble-report",
  inputSchema: RecommendStageSchema,
  outputSchema: AuditReportSchema,
  execute: async ({ inputData, getInitData, runtimeContext }) => {
    const emit = resolveEmit(runtimeContext);
    emit("assemble_report", "started");
    const listing = getInitData<typeof AppListingSchema>();
    const report = assembleReport({
      listing,
      results: inputData.results,
      dimensions: inputData.dimensions,
      recommendations: inputData.recommendations,
      generatedAt: new Date().toISOString(),
      extraWarnings: inputData.warnings,
    });
    emit("assemble_report", "completed");
    return report;
  },
});
