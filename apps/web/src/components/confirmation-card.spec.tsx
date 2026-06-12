import type { AuditPreview } from "@aso/schemas";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmationCard } from "./confirmation-card";

const preview: AuditPreview = {
  appId: "1",
  country: "us",
  url: "https://apps.apple.com/us/app/id1",
  title: "DigitPay",
  developer: "Digitpay Finance",
  category: "Finance",
  iconUrl: "https://example.com/icon.png",
};

describe("ConfirmationCard", () => {
  it("renders the app preview details and icon", () => {
    render(<ConfirmationCard preview={preview} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "DigitPay" })).toBeInTheDocument();
    expect(screen.getByText("Digitpay Finance")).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "DigitPay" })).toHaveAttribute(
      "src",
      "https://example.com/icon.png",
    );
  });

  it("invokes onConfirm when the confirm button is clicked", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmationCard preview={preview} onConfirm={onConfirm} onCancel={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Yes, run the audit/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("invokes onCancel when the cancel button is clicked", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmationCard preview={preview} onConfirm={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: /Try another link/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
