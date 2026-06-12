import type { ScreenshotAnalysis } from "@aso/schemas";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScreenshotAnalysisSection } from "./screenshot-analysis";

const analysis: ScreenshotAnalysis = {
  score: 58,
  strengths: ["Consistent palette"],
  weaknesses: ["No caption"],
  recommendations: ["Add a benefit caption"],
};

const shots = ["https://example.com/1.png", "https://example.com/2.png"];

describe("ScreenshotAnalysisSection", () => {
  it("renders nothing when there are no screenshots", () => {
    const { container } = render(
      <ScreenshotAnalysisSection screenshots={[]} analysis={analysis} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the gallery and the analysis breakdown with a score", () => {
    render(<ScreenshotAnalysisSection screenshots={shots} analysis={analysis} />);
    expect(screen.getByText("58/100")).toBeInTheDocument();
    // List items render as "• {item}", so match on a substring.
    expect(screen.getByText(/Consistent palette/)).toBeInTheDocument();
    expect(screen.getByText(/No caption/)).toBeInTheDocument();
    expect(screen.getByText(/Add a benefit caption/)).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("caps the gallery at ten screenshots", () => {
    const many = Array.from({ length: 15 }, (_, i) => `https://example.com/${i}.png`);
    render(<ScreenshotAnalysisSection screenshots={many} analysis={analysis} />);
    expect(screen.getAllByRole("img")).toHaveLength(10);
  });

  it("shows a fallback message when analysis is unavailable", () => {
    render(<ScreenshotAnalysisSection screenshots={shots} analysis={null} />);
    expect(screen.getByText("Screenshot analysis was unavailable.")).toBeInTheDocument();
    expect(screen.queryByText("58/100")).not.toBeInTheDocument();
  });

  it("renders 'None' for an empty findings group", () => {
    render(
      <ScreenshotAnalysisSection
        screenshots={shots}
        analysis={{ ...analysis, weaknesses: [] }}
      />,
    );
    expect(screen.getByText("None")).toBeInTheDocument();
  });
});
