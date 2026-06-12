import type { AuditReport } from "@aso/schemas";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReportView } from "./report-view";

function report(overrides: Partial<AuditReport> = {}): AuditReport {
  return {
    appId: "1",
    app: {
      appId: "1",
      title: "DigitPay",
      developer: "Digitpay Finance",
      category: "Finance",
      iconUrl: "https://example.com/icon.png",
      rating: 4.5,
      ratingCount: 120,
    },
    overallScore: 78,
    dimensions: [
      { dimension: "title", label: "Title", weight: 20, score: 72, weightedScore: 14.4, summary: "ok" },
    ],
    screenshots: [],
    screenshotAnalysis: null,
    competitorComparison: [],
    quickWins: [],
    highImpact: [],
    strategic: [],
    warnings: [],
    generatedAt: "2026-06-12T00:00:00.000Z",
    ...overrides,
  };
}

describe("ReportView", () => {
  it("renders the overall score, dimensions and the three recommendation sections", () => {
    render(<ReportView report={report()} />);
    expect(screen.getByText("78")).toBeInTheDocument();
    expect(screen.getByText("Dimension scores")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quick wins" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "High-impact changes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Strategic recommendations" })).toBeInTheDocument();
  });

  it("renders warnings when present and hides the block when absent", () => {
    const { rerender, container } = render(<ReportView report={report({ warnings: ["Heads up"] })} />);
    expect(screen.getByText(/Heads up/)).toBeInTheDocument();
    rerender(<ReportView report={report({ warnings: [] })} />);
    expect(container.textContent).not.toContain("⚠");
  });

  it("omits the competitor table when there are no comparison rows", () => {
    render(<ReportView report={report()} />);
    expect(screen.queryByText("Competitor comparison")).not.toBeInTheDocument();
  });

  it("renders the competitor table when comparison rows exist", () => {
    render(
      <ReportView
        report={report({
          competitorComparison: [
            {
              competitor: { appId: "2", title: "Rival", rating: 4 },
              positioning: "Rival competes in Finance.",
              metadataQuality: "weaker",
              screenshotQuality: "stronger",
            },
          ],
        })}
      />,
    );
    expect(screen.getByText("Competitor comparison")).toBeInTheDocument();
    expect(screen.getByText("Rival")).toBeInTheDocument();
  });
});
