import type { AppListing, Competitor } from "@aso/schemas";
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

function competitor(overrides: Partial<Competitor> = {}): Competitor {
  return { appId: "2", title: "Rival", ...overrides };
}

function assemble(l: AppListing) {
  return assembleReport({
    listing: l,
    results: emptyResults,
    dimensions: scoreDimensions(l, emptyResults),
    recommendations: { quickWins: [], highImpact: [], strategic: [] },
    generatedAt: "2026-06-12T00:00:00.000Z",
  });
}

describe("assembleReport", () => {
  it("maps the listing into the report app summary and carries warnings/screenshots", () => {
    const report = assemble(
      listing({ warnings: ["heads up"], screenshots: ["https://example.com/a.png"] }),
    );
    expect(report.appId).toBe("1");
    expect(report.app.title).toBe("DigitPay");
    expect(report.app.developer).toBe("Digitpay Finance");
    expect(report.warnings).toEqual(["heads up"]);
    expect(report.screenshots).toEqual(["https://example.com/a.png"]);
    expect(report.generatedAt).toBe("2026-06-12T00:00:00.000Z");
    expect(() => AuditReportSchema.parse(report)).not.toThrow();
  });

  it("produces an empty competitor comparison when there are no competitors", () => {
    expect(assemble(listing()).competitorComparison).toEqual([]);
  });

  it("rates the subject stronger when its rating clearly beats the competitor", () => {
    const report = assemble(
      listing({ rating: 5, competitors: [competitor({ rating: 4, category: "Finance" })] }),
    );
    const row = report.competitorComparison[0];
    expect(row.metadataQuality).toBe("stronger");
    expect(row.positioning).toContain("competes in Finance");
  });

  it("rates the subject weaker when its rating is clearly below the competitor", () => {
    const report = assemble(listing({ rating: 4, competitors: [competitor({ rating: 5 })] }));
    expect(report.competitorComparison[0].metadataQuality).toBe("weaker");
  });

  it("rates metadata comparable when the competitor rating is unknown", () => {
    const report = assemble(listing({ competitors: [competitor({ rating: undefined })] }));
    expect(report.competitorComparison[0].metadataQuality).toBe("comparable");
  });

  it("rates screenshot quality stronger when the subject has more screenshots", () => {
    const report = assemble(
      listing({
        screenshots: ["a", "b", "c", "d", "e"].map((s) => `https://example.com/${s}.png`),
        competitors: [competitor({ screenshotCount: 1 })],
      }),
    );
    expect(report.competitorComparison[0].screenshotQuality).toBe("stronger");
  });

  it("falls back to a generic positioning string when the competitor has no category", () => {
    const report = assemble(listing({ competitors: [competitor({ category: undefined })] }));
    expect(report.competitorComparison[0].positioning).toContain("is a comparable app");
  });
});
