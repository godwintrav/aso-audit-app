import type { AppListing, DimensionKey } from "@aso/schemas";
import { AuditReportSchema } from "@aso/schemas";
import { describe, expect, it } from "vitest";
import { assembleReport } from "./assemble";
import { scoreDimensions } from "./scoring";
import type { AnalysisResults } from "./types";

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
    rating: 5,
    ratingCount: 8,
    hasAppPreviewVideo: false,
    screenshots: ["https://example.com/1.png", "https://example.com/2.png"],
    reviews: [],
    competitors: [],
    warnings: [],
    ...overrides,
  };
}

const emptyResults: AnalysisResults = {
  title: null,
  subtitle: null,
  description: null,
  screenshots: null,
  reviews: null,
  competitors: null,
};

const ALL_KEYS: DimensionKey[] = [
  "title",
  "subtitle",
  "keywordField",
  "description",
  "screenshots",
  "appPreviewVideo",
  "ratingsAndReviews",
  "icon",
  "conversionSignals",
  "competitivePosition",
];

describe("scoreDimensions", () => {
  it("always produces all ten dimensions, even with no analysis", () => {
    const dims = scoreDimensions(listing(), emptyResults);
    expect(dims).toHaveLength(10);
    expect(dims.map((d) => d.dimension).sort()).toEqual([...ALL_KEYS].sort());
  });

  it("keeps every score within 0-100", () => {
    const dims = scoreDimensions(listing(), emptyResults);
    for (const d of dims) {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(100);
    }
  });

  it("uses analysis scores when present", () => {
    const dims = scoreDimensions(listing(), {
      ...emptyResults,
      title: { score: 91, findings: [], recommendations: [] },
    });
    expect(dims.find((d) => d.dimension === "title")?.score).toBe(91);
  });

  it("scores the subtitle low when none is set", () => {
    const dims = scoreDimensions(listing({ subtitle: undefined }), emptyResults);
    expect(dims.find((d) => d.dimension === "subtitle")?.score).toBeLessThan(40);
  });
});

describe("assembleReport", () => {
  it("produces a schema-valid report", () => {
    const dims = scoreDimensions(listing(), emptyResults);
    const report = assembleReport({
      listing: listing(),
      results: emptyResults,
      dimensions: dims,
      recommendations: { quickWins: [], highImpact: [], strategic: [] },
      generatedAt: new Date().toISOString(),
    });
    expect(() => AuditReportSchema.parse(report)).not.toThrow();
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
  });
});
