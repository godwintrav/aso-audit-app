import { computeOverallScore } from "@aso/core";
import type {
  AppListing,
  AuditReport,
  Competitor,
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
  extraWarnings?: string[];
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
    warnings: [...listing.warnings, ...(input.extraWarnings ?? [])],
    generatedAt,
  };
}

function buildComparison(listing: AppListing): CompetitorComparisonRow[] {
  const subjectStrength = metadataStrength(listing.rating, listing.ratingCount);

  return listing.competitors.map((competitor) => ({
    competitor,
    metadataQuality:
      competitor.rating === undefined
        ? "comparable"
        : compare(
            subjectStrength,
            metadataStrength(competitor.rating, competitor.ratingCount),
          ),
    screenshotQuality: compare(listing.screenshots.length, competitor.screenshotCount),
    positioning: describePositioning(competitor),
  }));
}

function metadataStrength(rating: number | undefined, ratingCount: number | undefined): number {
  const quality = ((rating ?? 0) / 5) * 70;
  const volume = Math.min(30, Math.log10((ratingCount ?? 0) + 1) * 10);
  return quality + volume;
}

function describePositioning(c: Competitor): string {
  const parts: string[] = [];
  if (typeof c.rating === "number") {
    parts.push(
      `${c.rating}★${c.ratingCount ? ` from ${c.ratingCount.toLocaleString()} ratings` : ""}`,
    );
  }
  if (c.category) parts.push(c.category);
  return parts.length ? `${c.title} — ${parts.join(" · ")}.` : `${c.title} is a comparable app.`;
}

function compare(
  subject: number,
  competitor: number | undefined,
): "weaker" | "comparable" | "stronger" {
  if (typeof competitor !== "number") return "comparable";
  const delta = subject - competitor;
  const threshold = Math.max(0.3, Math.abs(competitor) * 0.1);
  if (delta > threshold) return "stronger";
  if (delta < -threshold) return "weaker";
  return "comparable";
}
