import type { AnalysisGateway } from "@aso/agents";
import {
  MAX_REVIEWS_FOR_ANALYSIS,
  MAX_SCREENSHOTS_FOR_ANALYSIS,
} from "@aso/core";
import {
  buildCompetitorPrompt,
  buildDescriptionPrompt,
  buildRecommendationsPrompt,
  buildReviewPrompt,
  buildScreenshotPrompt,
  buildSubtitlePrompt,
  buildTitlePrompt,
} from "@aso/prompts";
import {
  type AppListing,
  type CompetitorAnalysis,
  CompetitorAnalysisSchema,
  type DescriptionAnalysis,
  DescriptionAnalysisSchema,
  type DimensionScore,
  type RecommendationSet,
  RecommendationSetSchema,
  type ReviewAnalysis,
  ReviewAnalysisSchema,
  type ScreenshotAnalysis,
  ScreenshotAnalysisSchema,
  type SubtitleAnalysis,
  SubtitleAnalysisSchema,
  type TitleAnalysis,
  TitleAnalysisSchema,
} from "@aso/schemas";


export function analyzeTitle(
  gateway: AnalysisGateway,
  input: { title: string; category: string },
): Promise<TitleAnalysis> {
  const { system, user } = buildTitlePrompt(input);
  return gateway.generateStructured({
    kind: "title",
    system,
    prompt: user,
    schema: TitleAnalysisSchema,
  });
}

export function analyzeSubtitle(
  gateway: AnalysisGateway,
  input: { title: string; subtitle: string },
): Promise<SubtitleAnalysis> {
  const { system, user } = buildSubtitlePrompt(input);
  return gateway.generateStructured({
    kind: "subtitle",
    system,
    prompt: user,
    schema: SubtitleAnalysisSchema,
  });
}

export function analyzeDescription(
  gateway: AnalysisGateway,
  input: { description: string },
): Promise<DescriptionAnalysis> {
  const { system, user } = buildDescriptionPrompt(input);
  return gateway.generateStructured({
    kind: "description",
    system,
    prompt: user,
    schema: DescriptionAnalysisSchema,
  });
}

export function analyzeScreenshots(
  gateway: AnalysisGateway,
  input: { screenshots: string[] },
): Promise<ScreenshotAnalysis> {
  const images = input.screenshots.slice(0, MAX_SCREENSHOTS_FOR_ANALYSIS);
  const { system, user } = buildScreenshotPrompt({ count: images.length });
  return gateway.generateStructured({
    kind: "screenshots",
    system,
    prompt: user,
    schema: ScreenshotAnalysisSchema,
    images,
  });
}

export function analyzeReviews(
  gateway: AnalysisGateway,
  input: { reviews: AppListing["reviews"]; rating: number; ratingCount: number },
): Promise<ReviewAnalysis> {
  const { system, user } = buildReviewPrompt({
    reviews: input.reviews.slice(0, MAX_REVIEWS_FOR_ANALYSIS),
    rating: input.rating,
    ratingCount: input.ratingCount,
  });
  return gateway.generateStructured({
    kind: "reviews",
    system,
    prompt: user,
    schema: ReviewAnalysisSchema,
  });
}

export function analyzeCompetitors(
  gateway: AnalysisGateway,
  input: {
    app: Pick<
      AppListing,
      "title" | "subtitle" | "category" | "rating" | "ratingCount"
    >;
    competitors: AppListing["competitors"];
  },
): Promise<CompetitorAnalysis> {
  const { system, user } = buildCompetitorPrompt(input);
  return gateway.generateStructured({
    kind: "competitors",
    system,
    prompt: user,
    schema: CompetitorAnalysisSchema,
  });
}

export function generateRecommendations(
  gateway: AnalysisGateway,
  input: {
    listing: AppListing;
    dimensions: DimensionScore[];
    analysisSummary: string;
  },
): Promise<RecommendationSet> {
  const { system, user } = buildRecommendationsPrompt(input);
  return gateway.generateStructured({
    kind: "recommendations",
    system,
    prompt: user,
    schema: RecommendationSetSchema,
  });
}
