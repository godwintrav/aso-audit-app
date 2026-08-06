import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BackendWakeupOverlay } from "./backend-wakeup-overlay";

describe("BackendWakeupOverlay", () => {
  it("explains the cold start while waking", () => {
    render(<BackendWakeupOverlay status="waking" elapsedMs={4_200} onRetry={vi.fn()} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Waking up the audit service")).toBeInTheDocument();
    expect(screen.getByTestId("wakeup-spinner")).toBeInTheDocument();
    expect(screen.getByText("4s elapsed")).toBeInTheDocument();
  });

  it("hides the counter before the first second has passed", () => {
    render(<BackendWakeupOverlay status="checking" elapsedMs={0} onRetry={vi.fn()} />);
    expect(screen.queryByText(/elapsed/)).not.toBeInTheDocument();
  });

  it("offers a retry once the backend is declared unreachable", async () => {
    const onRetry = vi.fn();
    render(<BackendWakeupOverlay status="unreachable" elapsedMs={120_000} onRetry={onRetry} />);

    expect(screen.getByText("Can't reach the audit service")).toBeInTheDocument();
    expect(screen.queryByTestId("wakeup-spinner")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
