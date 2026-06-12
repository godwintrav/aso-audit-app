import type { AppSummary } from "@aso/schemas";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OverallScoreCard } from "./overall-score";

function app(overrides: Partial<AppSummary> = {}): AppSummary {
  return {
    appId: "1",
    title: "DigitPay",
    subtitle: "Crypto payments",
    developer: "Digitpay Finance",
    category: "Finance",
    iconUrl: "https://example.com/icon.png",
    rating: 4.5,
    ratingCount: 1234,
    ...overrides,
  };
}

describe("OverallScoreCard", () => {
  it("renders the score, title and a localized rating count", () => {
    render(<OverallScoreCard score={82} app={app()} />);
    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "DigitPay" })).toBeInTheDocument();
    expect(screen.getByText(/1,234/)).toBeInTheDocument();
    expect(screen.getByText("Crypto payments")).toBeInTheDocument();
  });

  it("omits the subtitle line when there is no subtitle", () => {
    render(<OverallScoreCard score={50} app={app({ subtitle: undefined })} />);
    expect(screen.queryByText("Crypto payments")).not.toBeInTheDocument();
  });

  it("colors a high score green and a low score red", () => {
    const { rerender } = render(<OverallScoreCard score={90} app={app()} />);
    expect(screen.getByText("90").className).toContain("emerald");
    rerender(<OverallScoreCard score={20} app={app()} />);
    expect(screen.getByText("20").className).toContain("rose");
  });
});
