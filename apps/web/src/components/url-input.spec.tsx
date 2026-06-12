import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UrlInput } from "./url-input";

const VALID_URL = "https://apps.apple.com/us/app/digitpay/id6747904851";

describe("UrlInput", () => {
  it("shows the hint and an enabled submit button by default", () => {
    render(<UrlInput onSubmit={vi.fn()} loading={false} />);
    expect(screen.getByText(/Paste any Apple App Store app link/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Audit app" })).toBeEnabled();
  });

  it("submits a trimmed valid URL", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<UrlInput onSubmit={onSubmit} loading={false} />);
    await user.type(screen.getByRole("textbox"), `  ${VALID_URL}  `);
    await user.click(screen.getByRole("button", { name: "Audit app" }));
    expect(onSubmit).toHaveBeenCalledWith(VALID_URL);
  });

  it("rejects an invalid URL and surfaces an accessible error", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<UrlInput onSubmit={onSubmit} loading={false} />);
    await user.type(screen.getByRole("textbox"), "https://example.com/not-an-app");
    await user.click(screen.getByRole("button", { name: "Audit app" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Enter a valid Apple App Store app link/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("clears the error once the user edits the field again", async () => {
    const user = userEvent.setup();
    render(<UrlInput onSubmit={vi.fn()} loading={false} />);
    const input = screen.getByRole("textbox");
    await user.type(input, "bad");
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(screen.getByText(/Enter a valid Apple App Store app link/i)).toBeInTheDocument();
    await user.type(input, "x");
    expect(screen.queryByText(/Enter a valid Apple App Store app link/i)).not.toBeInTheDocument();
  });

  it("disables the submit button and shows a loading label while loading", () => {
    render(<UrlInput onSubmit={vi.fn()} loading={true} />);
    expect(screen.getByRole("button", { name: "Fetching…" })).toBeDisabled();
  });
});
