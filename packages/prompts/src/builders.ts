import { METADATA_LIMITS } from "@aso/core";
import type {
  AppListing,
  Competitor,
  DimensionScore,
  Review,
} from "@aso/schemas";
import { ASO_FRAMEWORK, SCORE_SCALE } from "./framework";

export interface Prompt {
  system: string;
  user: string;
}

function system(task: string): string {
  return `${ASO_FRAMEWORK}\n\n${SCORE_SCALE}\n\n${task}`;
}

export function buildTitlePrompt(input: {
  title: string;
  category: string;
}): Prompt {
  return {
    system: system(
      `Analyze the app TITLE only. Judge keyword usage, character utilization ` +
        `(limit ${METADATA_LIMITS.TITLE_MAX}), readability, keyword stuffing, and ` +
        `the balance between brand and keywords. Return findings and concrete ` +
        `recommendations.`,
    ),
    user: `Category: ${input.category}\nTitle (${input.title.length}/${METADATA_LIMITS.TITLE_MAX} chars): "${input.title}"`,
  };
}

export function buildSubtitlePrompt(input: {
  title: string;
  subtitle: string;
}): Prompt {
  return {
    system: system(
      `Analyze the app SUBTITLE only. Judge keyword coverage, benefit framing, ` +
        `character utilization (limit ${METADATA_LIMITS.SUBTITLE_MAX}), and whether ` +
        `it wastefully duplicates keywords already in the title.`,
    ),
    user: `Title: "${input.title}"\nSubtitle (${input.subtitle.length}/${METADATA_LIMITS.SUBTITLE_MAX} chars): "${input.subtitle}"`,
  };
}

export function buildDescriptionPrompt(input: { description: string }): Prompt {
  return {
    system: system(
      `Analyze the app DESCRIPTION only. Judge the opening hook (first lines ` +
        `before the fold), keyword integration, feature framing, scannability, ` +
        `and call-to-action effectiveness.`,
    ),
    user: `Description:\n"""\n${input.description}\n"""`,
  };
}

export function buildScreenshotPrompt(input: { count: number }): Prompt {
  return {
    system: system(
      `You are analyzing ONLY the app's screenshot gallery. Judge value ` +
        `proposition clarity, screenshot ordering, caption readability, visual ` +
        `hierarchy, conversion effectiveness, and design consistency. Do not ` +
        `comment on anything other than the screenshots. Do not write a report.`,
    ),
    user: `The following ${input.count} screenshots are the app's App Store gallery, in order. Analyze them as an ASO conversion asset.`,
  };
}

export function buildReviewPrompt(input: {
  reviews: Review[];
  rating: number;
  ratingCount: number;
}): Prompt {
  const reviewText = input.reviews
    .map((r, i) => `${i + 1}. ${r.title ? `[${r.title}] ` : ""}${r.body}`)
    .join("\n");
  return {
    system: system(
      `Analyze the app's RATINGS and user REVIEWS. Identify positive themes, ` +
        `complaint themes, trust indicators, and overall sentiment. Score the ` +
        `ratings-and-reviews dimension considering rating value, volume and sentiment.`,
    ),
    user: `Average rating: ${input.rating} from ${input.ratingCount} ratings.\n\nReviews:\n${reviewText || "(no review text available)"}`,
  };
}

export function buildCompetitorPrompt(input: {
  app: Pick<AppListing, "title" | "subtitle" | "category" | "rating" | "ratingCount">;
  competitors: Competitor[];
}): Prompt {
  const competitorText = input.competitors
    .map(
      (c) =>
        `- ${c.title} (${c.category ?? "?"}), rating ${c.rating ?? "?"} from ${
          c.ratingCount ?? "?"
        } ratings`,
    )
    .join("\n");
  return {
    system: system(
      `Compare the SUBJECT app against its competitors on ratings, metadata and ` +
        `positioning. Return the subject app's competitive strengths, weaknesses, ` +
        `and concrete opportunities to differentiate or out-rank them.`,
    ),
    user:
      `Subject app: "${input.app.title}"${
        input.app.subtitle ? `: "${input.app.subtitle}"` : ""
      } (${input.app.category}), rating ${input.app.rating} from ${
        input.app.ratingCount
      } ratings.\n\nCompetitors:\n${competitorText || "(none found)"}`,
  };
}

export function buildRecommendationsPrompt(input: {
  listing: AppListing;
  dimensions: DimensionScore[];
  analysisSummary: string;
}): Prompt {
  const dimText = input.dimensions
    .map((d) => `- ${d.label}: ${d.score}/100, ${d.summary}`)
    .join("\n");
  return {
    system: system(
      `Produce prioritized, evidence-driven ASO recommendations in three ` +
        `categories: quick_win (low effort, high impact), high_impact (higher ` +
        `effort, significant gains), and strategic (long-term, e.g. localization, ` +
        `keyword expansion, in-app events, custom product pages). Provide 3-5 in ` +
        `each category. Every recommendation MUST cite specific evidence from the ` +
        `data. For any recommendation that changes app text (title, subtitle, ` +
        `description), include concrete "before" and "after" copy. Avoid generic ` +
        `advice.`,
    ),
    user: `App: "${input.listing.title}"${
      input.listing.subtitle ? `: "${input.listing.subtitle}"` : ""
    } (${input.listing.category})
Title: "${input.listing.title}"
Subtitle: "${input.listing.subtitle ?? "(none set)"}"
Rating: ${input.listing.rating} from ${input.listing.ratingCount} ratings
Screenshots: ${input.listing.screenshots.length}
App preview video: ${input.listing.hasAppPreviewVideo ? "yes" : "no"}

Dimension scores:
${dimText}

Analysis highlights:
${input.analysisSummary}`,
  };
}
