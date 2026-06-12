import { describe, expect, it } from "vitest";
import { summarizeAnalyses } from "./summary";
import type { AnalysisResults } from "./types";

const empty: AnalysisResults = {
  title: null,
  subtitle: null,
  description: null,
  screenshots: null,
  reviews: null,
  competitors: null,
};

describe("summarizeAnalyses", () => {
  it("returns a fallback message when no analyses are present", () => {
    expect(summarizeAnalyses(empty)).toBe("No analysis signals were available.");
  });

  it("summarizes only the analyses that are present", () => {
    const summary = summarizeAnalyses({
      ...empty,
      title: { score: 72, findings: [], recommendations: ["Add a keyword"] },
    });
    expect(summary).toBe("Title (72/100): Add a keyword");
  });

  it("joins multiple recommendations with a semicolon", () => {
    const summary = summarizeAnalyses({
      ...empty,
      subtitle: { score: 60, findings: [], recommendations: ["One", "Two"] },
    });
    expect(summary).toContain("Subtitle (60/100): One; Two");
  });

  it("falls back when an analysis has no recommendations", () => {
    const summary = summarizeAnalyses({
      ...empty,
      description: { score: 65, findings: [], recommendations: [] },
    });
    expect(summary).toContain("Description (65/100): no specific recommendations");
  });

  it("reports screenshot weaknesses and 'none' when empty", () => {
    const withWeakness = summarizeAnalyses({
      ...empty,
      screenshots: { score: 58, strengths: [], weaknesses: ["No caption"], recommendations: [] },
    });
    expect(withWeakness).toContain("Screenshots (58/100): weaknesses: No caption");

    const withoutWeakness = summarizeAnalyses({
      ...empty,
      screenshots: { score: 58, strengths: [], weaknesses: [], recommendations: [] },
    });
    expect(withoutWeakness).toContain("weaknesses: none");
  });

  it("reports review sentiment and complaint themes", () => {
    const summary = summarizeAnalyses({
      ...empty,
      reviews: {
        score: 80,
        sentiment: "positive",
        positiveThemes: ["Fast"],
        complaintThemes: ["Bugs"],
        trustIndicators: [],
        recommendations: [],
      },
    });
    expect(summary).toContain("Reviews (80/100): positive; complaints: Bugs");
  });

  it("reports competitor opportunities", () => {
    const summary = summarizeAnalyses({
      ...empty,
      competitors: {
        score: 55,
        strengths: [],
        weaknesses: [],
        opportunities: ["Target stablecoin keyword"],
      },
    });
    expect(summary).toContain("Competitors (55/100): opportunities: Target stablecoin keyword");
  });

  it("combines all present analyses onto separate lines", () => {
    const summary = summarizeAnalyses({
      title: { score: 72, findings: [], recommendations: ["A"] },
      subtitle: { score: 60, findings: [], recommendations: ["B"] },
      description: null,
      screenshots: null,
      reviews: null,
      competitors: null,
    });
    expect(summary.split("\n")).toHaveLength(2);
  });
});
