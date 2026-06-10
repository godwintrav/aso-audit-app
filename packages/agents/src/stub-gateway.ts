import type { AnalysisGateway, AnalysisKind, GenerateStructuredInput } from "./gateway";

const CANNED: Record<AnalysisKind, unknown> = {
  title: {
    score: 72,
    findings: [
      { label: "Brand-led title", detail: "Title leads with the brand name.", severity: "info" },
      { label: "Few keywords", detail: "No high-value category keywords present.", severity: "warning" },
    ],
    recommendations: ["Add one category keyword after the brand name."],
  },
  subtitle: {
    score: 60,
    findings: [
      { label: "Benefit framing", detail: "Subtitle frames a benefit.", severity: "positive" },
    ],
    recommendations: ["Use the full 30 characters with a second keyword."],
  },
  description: {
    score: 65,
    findings: [
      { label: "Weak hook", detail: "Opening lines do not state the core value.", severity: "warning" },
    ],
    recommendations: ["Lead with the primary benefit in the first line."],
  },
  screenshots: {
    score: 58,
    strengths: ["Consistent color palette."],
    weaknesses: ["First screenshot lacks a clear value-proposition caption."],
    recommendations: ["Add a benefit-led caption to the first screenshot."],
  },
  reviews: {
    score: 80,
    sentiment: "positive",
    positiveThemes: ["Fast payments", "Simple UI"],
    complaintThemes: [],
    trustIndicators: ["Multiple reviews praise reliability."],
    recommendations: ["Encourage more reviews to grow volume."],
  },
  competitors: {
    score: 55,
    strengths: ["Higher average rating than several competitors."],
    weaknesses: ["Lower review volume than category leaders."],
    opportunities: ["Target underserved 'stablecoin payments' keyword."],
  },
  recommendations: {
    quickWins: [
      {
        category: "quick_win",
        title: "Expand the subtitle with a second keyword",
        evidence: "Subtitle uses only 21 of 30 characters.",
        reason: "Adds keyword coverage without harming clarity.",
        impact: "medium",
        effort: "low",
        before: "Crypto payments to fiat",
        after: "Crypto Payments, Bills & Transfers",
      },
    ],
    highImpact: [
      {
        category: "high_impact",
        title: "Redesign the first two screenshots",
        evidence: "First screenshot has no value-proposition caption.",
        reason: "Screenshots are the primary conversion driver.",
        impact: "high",
        effort: "medium",
      },
    ],
    strategic: [
      {
        category: "strategic",
        title: "Localize the listing for key markets",
        evidence: "Listing is English-only while the app targets African markets.",
        reason: "Localization unlocks ranking in additional storefronts.",
        impact: "high",
        effort: "high",
      },
    ],
  },
};

export interface StubGatewayOptions {
  overrides?: Partial<Record<AnalysisKind, unknown>>;
  failOn?: AnalysisKind[];
}

export function createStubGateway(options: StubGatewayOptions = {}): AnalysisGateway {
  const failOn = new Set(options.failOn ?? []);
  return {
    async generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T> {
      if (failOn.has(input.kind)) {
        throw new Error(`Stub gateway: forced failure for kind "${input.kind}"`);
      }
      const payload = options.overrides?.[input.kind] ?? CANNED[input.kind];
      return input.schema.parse(payload);
    },
  };
}
