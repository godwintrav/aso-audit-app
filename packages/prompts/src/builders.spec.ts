import { METADATA_LIMITS } from "@aso/core";
import type { AppListing, Competitor, DimensionScore, Review } from "@aso/schemas";
import { describe, expect, it } from "vitest";
import {
  buildCompetitorPrompt,
  buildDescriptionPrompt,
  buildRecommendationsPrompt,
  buildReviewPrompt,
  buildScreenshotPrompt,
  buildSubtitlePrompt,
  buildTitlePrompt,
} from "./builders";
import { ASO_FRAMEWORK, SCORE_SCALE } from "./framework";

function listing(overrides: Partial<AppListing> = {}): AppListing {
  return {
    appId: "1",
    country: "us",
    url: "https://apps.apple.com/us/app/id1",
    title: "DigitPay",
    subtitle: "Crypto payments to fiat",
    description: "Pay, save, earn and spend.",
    developer: "Digitpay Finance",
    category: "Finance",
    iconUrl: "https://example.com/icon.png",
    rating: 4.5,
    ratingCount: 120,
    hasAppPreviewVideo: false,
    screenshots: ["https://example.com/1.png", "https://example.com/2.png"],
    reviews: [],
    competitors: [],
    warnings: [],
    ...overrides,
  };
}

describe("buildTitlePrompt", () => {
  it("embeds the framework, score scale, category, title and character usage", () => {
    const { system, user } = buildTitlePrompt({ title: "DigitPay", category: "Finance" });
    expect(system).toContain(ASO_FRAMEWORK);
    expect(system).toContain(SCORE_SCALE);
    expect(system).toContain(String(METADATA_LIMITS.TITLE_MAX));
    expect(user).toContain("Category: Finance");
    expect(user).toContain(`(8/${METADATA_LIMITS.TITLE_MAX} chars)`);
    expect(user).toContain('"DigitPay"');
  });

  it("reports zero length for an empty title", () => {
    const { user } = buildTitlePrompt({ title: "", category: "Finance" });
    expect(user).toContain(`(0/${METADATA_LIMITS.TITLE_MAX} chars)`);
  });
});

describe("buildSubtitlePrompt", () => {
  it("includes the title, subtitle and its character utilization", () => {
    const { system, user } = buildSubtitlePrompt({ title: "DigitPay", subtitle: "Crypto wallet" });
    expect(system).toContain(String(METADATA_LIMITS.SUBTITLE_MAX));
    expect(user).toContain('Title: "DigitPay"');
    expect(user).toContain(`(13/${METADATA_LIMITS.SUBTITLE_MAX} chars)`);
  });
});

describe("buildDescriptionPrompt", () => {
  it("wraps the description in delimiters", () => {
    const { user } = buildDescriptionPrompt({ description: "Hello world" });
    expect(user).toContain("Hello world");
    expect(user).toContain('"""');
  });

  it("handles an empty description without throwing", () => {
    expect(() => buildDescriptionPrompt({ description: "" })).not.toThrow();
  });
});

describe("buildScreenshotPrompt", () => {
  it("states the screenshot count in the user prompt", () => {
    const { user } = buildScreenshotPrompt({ count: 5 });
    expect(user).toContain("5 screenshots");
  });

  it("handles a zero count", () => {
    const { user } = buildScreenshotPrompt({ count: 0 });
    expect(user).toContain("0 screenshots");
  });
});

describe("buildReviewPrompt", () => {
  const reviews: Review[] = [
    { title: "Great", body: "Love it", rating: 5 },
    { body: "No title here", rating: 4 },
  ];

  it("numbers reviews and renders optional titles", () => {
    const { user } = buildReviewPrompt({ reviews, rating: 4.5, ratingCount: 200 });
    expect(user).toContain("Average rating: 4.5 from 200 ratings");
    expect(user).toContain("1. [Great] Love it");
    expect(user).toContain("2. No title here");
  });

  it("falls back to a placeholder when there are no reviews", () => {
    const { user } = buildReviewPrompt({ reviews: [], rating: 0, ratingCount: 0 });
    expect(user).toContain("(no review text available)");
  });
});

describe("buildCompetitorPrompt", () => {
  const app = {
    title: "DigitPay",
    subtitle: "Crypto payments to fiat",
    category: "Finance",
    rating: 4.5,
    ratingCount: 120,
  };

  it("lists competitors with fallbacks for missing fields", () => {
    const competitors: Competitor[] = [
      { appId: "2", title: "Rival", category: "Finance", rating: 4, ratingCount: 50 },
      { appId: "3", title: "Bare" },
    ];
    const { user } = buildCompetitorPrompt({ app, competitors });
    expect(user).toContain('Subject app: "DigitPay": "Crypto payments to fiat"');
    expect(user).toContain("- Rival (Finance), rating 4 from 50 ratings");
    expect(user).toContain("- Bare (?), rating ? from ? ratings");
  });

  it("omits the subtitle clause when subtitle is absent and notes no competitors", () => {
    const { user } = buildCompetitorPrompt({
      app: { ...app, subtitle: undefined },
      competitors: [],
    });
    expect(user).toContain('Subject app: "DigitPay" (Finance)');
    expect(user).not.toContain('"DigitPay": "');
    expect(user).toContain("(none found)");
  });
});

describe("buildRecommendationsPrompt", () => {
  const dimensions: DimensionScore[] = [
    {
      dimension: "title",
      label: "Title",
      score: 72,
      weight: 20,
      weightedScore: 14.4,
      summary: "Solid brand-led title",
    },
  ];

  it("summarizes dimensions, listing facts and analysis highlights", () => {
    const { user } = buildRecommendationsPrompt({
      listing: listing(),
      dimensions,
      analysisSummary: "Title is strong; subtitle is weak.",
    });
    expect(user).toContain('App: "DigitPay": "Crypto payments to fiat" (Finance)');
    expect(user).toContain("- Title: 72/100, Solid brand-led title");
    expect(user).toContain("Screenshots: 2");
    expect(user).toContain("App preview video: no");
    expect(user).toContain("Title is strong; subtitle is weak.");
  });

  it("renders placeholders when subtitle is unset and video present", () => {
    const { user } = buildRecommendationsPrompt({
      listing: listing({ subtitle: undefined, hasAppPreviewVideo: true }),
      dimensions,
      analysisSummary: "summary",
    });
    expect(user).toContain('Subtitle: "(none set)"');
    expect(user).toContain("App preview video: yes");
  });
});
