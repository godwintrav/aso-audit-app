import { computeOverallScore } from "@aso/core";
import type {
  AppListing,
  AuditReport,
  CompetitorComparisonRow,
  DimensionScore,
  RecommendationSet,
} from "@aso/schemas";
import type { AnalysisResults } from "./types";


export function assembleReport(input: {
  listing: AppListing;
  results: AnalysisResults;
  dimensions: DimensionScore[];
  recommendations: RecommendationSet;
  generatedAt: string;
}): AuditReport {
  const { listing, results, dimensions, recommendations, generatedAt } = input;

  return {
    appId: listing.appId,
    app: {
      appId: listing.appId,
      title: listing.title,
      subtitle: listing.subtitle,
      developer: listing.developer,
      category: listing.category,
      iconUrl: listing.iconUrl,
      rating: listing.rating,
      ratingCount: listing.ratingCount,
    },
    overallScore: computeOverallScore(dimensions),
    dimensions,
    screenshots: listing.screenshots,
    screenshotAnalysis: results.screenshots,
    competitorComparison: buildComparison(listing),
    quickWins: recommendations.quickWins,
    highImpact: recommendations.highImpact,
    strategic: recommendations.strategic,
    warnings: listing.warnings,
    generatedAt,
  };
}

function buildComparison(listing: AppListing): CompetitorComparisonRow[] {
  return listing.competitors.map((competitor) => {
    const metadataQuality = compare(listing.rating, competitor.rating);
    const screenshotQuality = compare(
      listing.screenshots.length,
      competitor.screenshotCount,
    );
    return {
      competitor,
      positioning: competitor.category
        ? `${competitor.title} competes in ${competitor.category}.`
        : `${competitor.title} is a comparable app.`,
      metadataQuality,
      screenshotQuality,
    };
  });
}

function compare(
  subject: number,
  competitor: number | undefined,
): "weaker" | "comparable" | "stronger" {
  if (typeof competitor !== "number") return "comparable";
  const delta = subject - competitor;
  const threshold = Math.max(0.3, competitor * 0.1);
  if (delta > threshold) return "stronger";
  if (delta < -threshold) return "weaker";
  return "comparable";
}
