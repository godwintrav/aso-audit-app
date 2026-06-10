import type { AnalysisResults } from "./types";

export function summarizeAnalyses(results: AnalysisResults): string {
  const lines: string[] = [];

  if (results.title) {
    lines.push(`Title (${results.title.score}/100): ${joinRecs(results.title.recommendations)}`);
  }
  if (results.subtitle) {
    lines.push(
      `Subtitle (${results.subtitle.score}/100): ${joinRecs(results.subtitle.recommendations)}`,
    );
  }
  if (results.description) {
    lines.push(
      `Description (${results.description.score}/100): ${joinRecs(results.description.recommendations)}`,
    );
  }
  if (results.screenshots) {
    lines.push(
      `Screenshots (${results.screenshots.score}/100): weaknesses: ${results.screenshots.weaknesses.join("; ") || "none"}`,
    );
  }
  if (results.reviews) {
    lines.push(
      `Reviews (${results.reviews.score}/100): ${results.reviews.sentiment}; complaints: ${results.reviews.complaintThemes.join("; ") || "none"}`,
    );
  }
  if (results.competitors) {
    lines.push(
      `Competitors (${results.competitors.score}/100): opportunities: ${results.competitors.opportunities.join("; ") || "none"}`,
    );
  }

  return lines.join("\n") || "No analysis signals were available.";
}

function joinRecs(recs: string[]): string {
  return recs.join("; ") || "no specific recommendations";
}
