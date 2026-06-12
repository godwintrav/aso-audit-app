import type { CompetitorComparisonRow } from "@aso/schemas";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompetitorTable } from "./competitor-table";

function row(overrides: Partial<CompetitorComparisonRow> = {}): CompetitorComparisonRow {
  return {
    competitor: { appId: "2", title: "Rival", rating: 4.2 },
    positioning: "Rival competes in Finance.",
    metadataQuality: "stronger",
    screenshotQuality: "comparable",
    ...overrides,
  };
}

describe("CompetitorTable", () => {
  it("returns null (renders nothing) when there are no rows", () => {
    const { container } = render(<CompetitorTable rows={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a row per competitor with rating and quality badges", () => {
    render(<CompetitorTable rows={[row()]} />);
    expect(screen.getByText("Rival")).toBeInTheDocument();
    expect(screen.getByText("4.2★")).toBeInTheDocument();
    expect(screen.getByText("stronger")).toBeInTheDocument();
    expect(screen.getByText("comparable")).toBeInTheDocument();
    expect(screen.getByText("Rival competes in Finance.")).toBeInTheDocument();
  });

  it("shows N/A when a competitor has no rating", () => {
    render(<CompetitorTable rows={[row({ competitor: { appId: "3", title: "Bare" } })]} />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });
});
