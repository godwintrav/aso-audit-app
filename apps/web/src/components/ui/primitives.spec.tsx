import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, Card, CardTitle, ProgressBar } from "./primitives";

describe("Card", () => {
  it("merges custom classNames with the base styles", () => {
    render(
      <Card className="custom-class" data-testid="card">
        body
      </Card>,
    );
    const card = screen.getByTestId("card");
    expect(card.className).toContain("custom-class");
    expect(card.className).toContain("rounded-2xl");
  });
});

describe("CardTitle", () => {
  it("renders an h3 heading", () => {
    render(<CardTitle>Dimension scores</CardTitle>);
    expect(screen.getByRole("heading", { level: 3, name: "Dimension scores" })).toBeInTheDocument();
  });
});

describe("Badge", () => {
  it("applies the tone styling", () => {
    render(<Badge tone="good">stronger</Badge>);
    expect(screen.getByText("stronger").className).toContain("emerald");
  });

  it("defaults to the neutral tone", () => {
    render(<Badge>plain</Badge>);
    expect(screen.getByText("plain").className).toContain("slate");
  });
});

describe("ProgressBar", () => {
  it("renders the value as a width style", () => {
    const { container } = render(<ProgressBar value={42} />);
    const bar = container.querySelector("[style]") as HTMLElement;
    expect(bar.style.width).toBe("42%");
  });

  it("clamps values above 100", () => {
    const { container } = render(<ProgressBar value={150} />);
    const bar = container.querySelector("[style]") as HTMLElement;
    expect(bar.style.width).toBe("100%");
  });

  it("clamps negative values to zero", () => {
    const { container } = render(<ProgressBar value={-20} />);
    const bar = container.querySelector("[style]") as HTMLElement;
    expect(bar.style.width).toBe("0%");
  });
});
