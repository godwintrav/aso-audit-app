import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssistantBubble, UserBubble } from "./bubbles";

describe("UserBubble", () => {
  it("renders the user text", () => {
    render(<UserBubble text="https://apps.apple.com/us/app/id1" />);
    expect(screen.getByText("https://apps.apple.com/us/app/id1")).toBeInTheDocument();
  });
});

describe("AssistantBubble", () => {
  it("wraps plain string content in a bubble", () => {
    render(<AssistantBubble>Looking up the app…</AssistantBubble>);
    expect(screen.getByText("Looking up the app…")).toBeInTheDocument();
  });

  it("applies error styling for the error tone", () => {
    render(<AssistantBubble tone="error">It failed</AssistantBubble>);
    const node = screen.getByText("It failed");
    expect(node.className).toContain("rose");
  });

  it("renders rich children full-width without a text bubble", () => {
    render(
      <AssistantBubble>
        <div data-testid="rich">report</div>
      </AssistantBubble>,
    );
    expect(screen.getByTestId("rich")).toBeInTheDocument();
  });
});
