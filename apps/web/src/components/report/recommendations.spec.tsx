import type { Recommendation } from "@aso/schemas";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecommendationSection } from "./recommendations";

function rec(overrides: Partial<Recommendation> = {}): Recommendation {
  return {
    category: "quick_win",
    title: "Expand the subtitle",
    evidence: "Subtitle uses only 21 of 30 characters.",
    reason: "Adds keyword coverage.",
    impact: "medium",
    effort: "low",
    ...overrides,
  };
}

describe("RecommendationSection", () => {
  it("renders the section title and description", () => {
    render(<RecommendationSection title="Quick wins" description="Ship these first." items={[]} />);
    expect(screen.getByRole("heading", { name: "Quick wins" })).toBeInTheDocument();
    expect(screen.getByText("Ship these first.")).toBeInTheDocument();
  });

  it("shows an empty-state message when there are no items", () => {
    render(<RecommendationSection title="Quick wins" description="d" items={[]} />);
    expect(screen.getByText("No recommendations in this category.")).toBeInTheDocument();
  });

  it("renders a recommendation with impact, effort, reason and evidence", () => {
    render(<RecommendationSection title="Quick wins" description="d" items={[rec()]} />);
    expect(screen.getByText("Expand the subtitle")).toBeInTheDocument();
    expect(screen.getByText("impact: medium")).toBeInTheDocument();
    expect(screen.getByText("effort: low")).toBeInTheDocument();
    expect(screen.getByText("Adds keyword coverage.")).toBeInTheDocument();
    expect(screen.getByText(/Subtitle uses only 21/)).toBeInTheDocument();
  });

  it("renders before/after copy when provided", () => {
    render(
      <RecommendationSection
        title="Quick wins"
        description="d"
        items={[rec({ before: "Old copy", after: "New copy" })]}
      />,
    );
    expect(screen.getByText("Before")).toBeInTheDocument();
    expect(screen.getByText("Old copy")).toBeInTheDocument();
    expect(screen.getByText("After")).toBeInTheDocument();
    expect(screen.getByText("New copy")).toBeInTheDocument();
  });

  it("omits the before/after block when neither is provided", () => {
    render(<RecommendationSection title="Quick wins" description="d" items={[rec()]} />);
    expect(screen.queryByText("Before")).not.toBeInTheDocument();
    expect(screen.queryByText("After")).not.toBeInTheDocument();
  });
});
