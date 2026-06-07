import { clampScore, DIMENSION_BY_KEY, weightedScore } from "@aso/core";
import type { AppListing, DimensionKey, DimensionScore } from "@aso/schemas";
import type { AnalysisResults } from "./types";

interface DimensionResult {
  score: number;
  summary: string;
}

/**
 * Derives a score for every one of the ten ASO dimensions. Dimensions backed
 * by an LLM analysis use that analysis's score; the remainder (keyword field,
 * video, icon, conversion, competitive position) are derived from metadata
 * heuristics so the rubric is always fully populated, even under degradation.
 */
export function scoreDimensions(
  listing: AppListing,
  results: AnalysisResults,
): DimensionScore[] {
  const byKey: Record<DimensionKey, DimensionResult> = {
    title: results.title
      ? { score: results.title.score, summary: summarizeText(results.title.findings) }
      : { score: 30, summary: "Title could not be analyzed." },

    subtitle: scoreSubtitle(listing, results),

    keywordField: scoreKeywordField(results),

    description: results.description
      ? {
          score: results.description.score,
          summary: summarizeText(results.description.findings),
        }
      : { score: 30, summary: "Description could not be analyzed." },

    screenshots: scoreScreenshots(listing, results),

    appPreviewVideo: listing.hasAppPreviewVideo
      ? { score: 80, summary: "App preview video is present." }
      : { score: 30, summary: "No app preview video — a missed conversion lever." },

    ratingsAndReviews: scoreRatings(listing, results),

    icon: listing.iconUrl
      ? { score: 70, summary: "Icon is present; review clarity and category fit." }
      : { score: 0, summary: "No icon available." },

    conversionSignals: scoreConversion(listing, results),

    competitivePosition: scoreCompetitive(listing, results),
  };

  return (Object.keys(byKey) as DimensionKey[]).map((key) => {
    const def = DIMENSION_BY_KEY[key];
    const { score, summary } = byKey[key];
    const clamped = clampScore(score);
    return {
      dimension: key,
      label: def.label,
      weight: def.weight,
      score: clamped,
      weightedScore: weightedScore(clamped, def.weight),
      summary,
    };
  });
}

function summarizeText(findings: { detail: string }[]): string {
  return findings[0]?.detail ?? "Analyzed.";
}

function scoreSubtitle(listing: AppListing, results: AnalysisResults): DimensionResult {
  if (results.subtitle) {
    return {
      score: results.subtitle.score,
      summary: summarizeText(results.subtitle.findings),
    };
  }
  if (!listing.subtitle) {
    return { score: 20, summary: "No subtitle is set — a high-value keyword field is unused." };
  }
  return { score: 40, summary: "Subtitle present but could not be analyzed." };
}

function scoreKeywordField(results: AnalysisResults): DimensionResult {
  // The keyword field is never public; infer quality from title + subtitle
  // keyword strength as a proxy.
  const signals = [results.title?.score, results.subtitle?.score].filter(
    (s): s is number => typeof s === "number",
  );
  if (signals.length === 0) {
    return { score: 35, summary: "Keyword targeting could not be inferred." };
  }
  const avg = signals.reduce((a, b) => a + b, 0) / signals.length;
  return {
    score: Math.round(avg * 0.85),
    summary: "Inferred from title and subtitle keyword strength (field is not public).",
  };
}

function scoreScreenshots(listing: AppListing, results: AnalysisResults): DimensionResult {
  if (results.screenshots) {
    return {
      score: results.screenshots.score,
      summary:
        results.screenshots.weaknesses[0] ??
        results.screenshots.strengths[0] ??
        "Screenshots analyzed.",
    };
  }
  if (listing.screenshots.length === 0) {
    return { score: 0, summary: "No screenshots available." };
  }
  return {
    score: 45,
    summary: `${listing.screenshots.length} screenshots present but not analyzed.`,
  };
}

function scoreRatings(listing: AppListing, results: AnalysisResults): DimensionResult {
  // Blend the qualitative review analysis with quantitative rating signals.
  const ratingScore = (listing.rating / 5) * 100;
  const volumeBonus = Math.min(20, Math.log10(listing.ratingCount + 1) * 10);
  const quantitative = clampScore(ratingScore * 0.8 + volumeBonus);

  if (results.reviews) {
    return {
      score: Math.round((results.reviews.score + quantitative) / 2),
      summary: `Sentiment ${results.reviews.sentiment}; ${listing.rating}★ from ${listing.ratingCount} ratings.`,
    };
  }
  return {
    score: quantitative,
    summary: `${listing.rating}★ from ${listing.ratingCount} ratings (review text unavailable).`,
  };
}

function scoreConversion(listing: AppListing, results: AnalysisResults): DimensionResult {
  // Conversion readiness blends screenshots, ratings and description quality.
  const parts = [
    results.screenshots?.score,
    results.description?.score,
    (listing.rating / 5) * 100,
  ].filter((s): s is number => typeof s === "number");
  const avg = parts.reduce((a, b) => a + b, 0) / (parts.length || 1);
  return {
    score: Math.round(avg),
    summary: "Composite of screenshot, description and rating signals.",
  };
}

function scoreCompetitive(listing: AppListing, results: AnalysisResults): DimensionResult {
  if (results.competitors) {
    return {
      score: results.competitors.score,
      summary:
        results.competitors.opportunities[0] ??
        results.competitors.strengths[0] ??
        "Competitive position analyzed.",
    };
  }
  const rated = listing.competitors.filter((c) => typeof c.rating === "number");
  if (rated.length === 0) {
    return { score: 40, summary: "No competitor data available to benchmark against." };
  }
  const competitorAvg =
    rated.reduce((sum, c) => sum + (c.rating ?? 0), 0) / rated.length;
  const relative = clampScore(50 + (listing.rating - competitorAvg) * 20);
  return {
    score: relative,
    summary: `Rating ${listing.rating}★ vs competitor average ${competitorAvg.toFixed(1)}★.`,
  };
}
