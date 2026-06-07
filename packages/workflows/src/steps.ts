import { createStep } from "@mastra/core/workflows";
import type { RuntimeContext } from "@mastra/core/runtime-context";
import {
  analyzeCompetitors,
  analyzeDescription,
  analyzeReviews,
  analyzeScreenshots,
  analyzeSubtitle,
  analyzeTitle,
  generateRecommendations,
} from "@aso/tools";
import { z } from "zod";
import { AUDIT_CONTEXT_KEY, type AuditRunContext } from "./context";
import { assembleReport } from "./assemble";
import { scoreDimensions } from "./scoring";
import { summarizeAnalyses } from "./summary";

/**
 * Steps communicate through the shared run context (see context.ts), so the
 * per-step data channel is intentionally empty.
 */
const StepIO = z.object({});

function ctxOf(runtimeContext: RuntimeContext): AuditRunContext {
  const ctx = runtimeContext.get(AUDIT_CONTEXT_KEY) as AuditRunContext | undefined;
  if (!ctx) {
    throw new Error("Audit run context was not provided to the workflow run.");
  }
  return ctx;
}

/** Analyze title, subtitle and description together (the "metadata" stage). */
export const analyzeMetadataStep = createStep({
  id: "analyze-metadata",
  inputSchema: StepIO,
  outputSchema: StepIO,
  execute: async ({ runtimeContext }) => {
    const ctx = ctxOf(runtimeContext);
    ctx.emit("analyze_metadata", "started");
    const { listing, gateway, results } = ctx;

    await Promise.allSettled([
      analyzeTitle(gateway, { title: listing.title, category: listing.category }).then(
        (r) => (results.title = r),
      ),
      listing.subtitle
        ? analyzeSubtitle(gateway, {
            title: listing.title,
            subtitle: listing.subtitle,
          }).then((r) => (results.subtitle = r))
        : Promise.resolve(),
      analyzeDescription(gateway, { description: listing.description }).then(
        (r) => (results.description = r),
      ),
    ]);

    ctx.emit("analyze_metadata", "completed");
    return {};
  },
});

export const analyzeScreenshotsStep = createStep({
  id: "analyze-screenshots",
  inputSchema: StepIO,
  outputSchema: StepIO,
  execute: async ({ runtimeContext }) => {
    const ctx = ctxOf(runtimeContext);
    ctx.emit("analyze_screenshots", "started");
    const { listing, gateway, results } = ctx;

    if (listing.screenshots.length === 0) {
      ctx.emit("analyze_screenshots", "completed", "No screenshots available.");
      return {};
    }
    try {
      results.screenshots = await analyzeScreenshots(gateway, {
        screenshots: listing.screenshots,
      });
      ctx.emit("analyze_screenshots", "completed");
    } catch (error) {
      ctx.emit("analyze_screenshots", "failed", describe(error));
    }
    return {};
  },
});

export const analyzeReviewsStep = createStep({
  id: "analyze-reviews",
  inputSchema: StepIO,
  outputSchema: StepIO,
  execute: async ({ runtimeContext }) => {
    const ctx = ctxOf(runtimeContext);
    ctx.emit("analyze_reviews", "started");
    const { listing, gateway, results } = ctx;

    if (listing.reviews.length === 0) {
      ctx.emit("analyze_reviews", "completed", "No reviews available.");
      return {};
    }
    try {
      results.reviews = await analyzeReviews(gateway, {
        reviews: listing.reviews,
        rating: listing.rating,
        ratingCount: listing.ratingCount,
      });
      ctx.emit("analyze_reviews", "completed");
    } catch (error) {
      ctx.emit("analyze_reviews", "failed", describe(error));
    }
    return {};
  },
});

export const analyzeCompetitorsStep = createStep({
  id: "analyze-competitors",
  inputSchema: StepIO,
  outputSchema: StepIO,
  execute: async ({ runtimeContext }) => {
    const ctx = ctxOf(runtimeContext);
    ctx.emit("analyze_competitors", "started");
    const { listing, gateway, results } = ctx;

    if (listing.competitors.length === 0) {
      ctx.emit("analyze_competitors", "completed", "No competitors found.");
      return {};
    }
    try {
      results.competitors = await analyzeCompetitors(gateway, {
        app: {
          title: listing.title,
          subtitle: listing.subtitle,
          category: listing.category,
          rating: listing.rating,
          ratingCount: listing.ratingCount,
        },
        competitors: listing.competitors,
      });
      ctx.emit("analyze_competitors", "completed");
    } catch (error) {
      ctx.emit("analyze_competitors", "failed", describe(error));
    }
    return {};
  },
});

export const generateScoresStep = createStep({
  id: "generate-scores",
  inputSchema: StepIO,
  outputSchema: StepIO,
  execute: async ({ runtimeContext }) => {
    const ctx = ctxOf(runtimeContext);
    ctx.emit("generate_scores", "started");
    ctx.dimensions = scoreDimensions(ctx.listing, ctx.results);
    ctx.emit("generate_scores", "completed");
    return {};
  },
});

export const generateRecommendationsStep = createStep({
  id: "generate-recommendations",
  inputSchema: StepIO,
  outputSchema: StepIO,
  execute: async ({ runtimeContext }) => {
    const ctx = ctxOf(runtimeContext);
    ctx.emit("generate_recommendations", "started");
    const dimensions = ctx.dimensions ?? [];
    try {
      ctx.recommendations = await generateRecommendations(ctx.gateway, {
        listing: ctx.listing,
        dimensions,
        analysisSummary: summarizeAnalyses(ctx.results),
      });
      ctx.emit("generate_recommendations", "completed");
    } catch (error) {
      ctx.recommendations = { quickWins: [], highImpact: [], strategic: [] };
      ctx.listing.warnings.push("Recommendation generation failed; report omits suggestions.");
      ctx.emit("generate_recommendations", "failed", describe(error));
    }
    return {};
  },
});

export const assembleReportStep = createStep({
  id: "assemble-report",
  inputSchema: StepIO,
  outputSchema: StepIO,
  execute: async ({ runtimeContext }) => {
    const ctx = ctxOf(runtimeContext);
    ctx.emit("assemble_report", "started");
    ctx.report = assembleReport({
      listing: ctx.listing,
      results: ctx.results,
      dimensions: ctx.dimensions ?? [],
      recommendations:
        ctx.recommendations ?? { quickWins: [], highImpact: [], strategic: [] },
      generatedAt: new Date().toISOString(),
    });
    ctx.emit("assemble_report", "completed");
    return {};
  },
});

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
