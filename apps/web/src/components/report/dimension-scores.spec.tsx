import type { DimensionScore } from "@aso/schemas";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DimensionScores } from "./dimension-scores";

function dim(overrides: Partial<DimensionScore> = {}): DimensionScore {
  return {
    dimension: "title",
    label: "Title",
    weight: 20,
    score: 72,
    weightedScore: 14.4,
    summary: "Solid brand-led title",
    ...overrides,
  };
}

describe("DimensionScores", () => {
  it("renders a row per dimension with label, weight, score and summary", () => {
    render(
      <DimensionScores
        dimensions={[
          dim({ dimension: "title", label: "Title", weight: 20, score: 72, summary: "Title summary" }),
          dim({ dimension: "subtitle", label: "Subtitle", weight: 15, score: 40, summary: "Subtitle summary" }),
        ]}
      />,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Subtitle")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText(/weight 20%/)).toBeInTheDocument();
    expect(screen.getByText("Title summary")).toBeInTheDocument();
    expect(screen.getByText("Subtitle summary")).toBeInTheDocument();
  });

  it("renders nothing in the list for an empty dimension array", () => {
    render(<DimensionScores dimensions={[]} />);
    expect(screen.getByText("Dimension scores")).toBeInTheDocument();
    expect(screen.queryByText("Title")).not.toBeInTheDocument();
  });
});
