import type { ConversationSummary } from "@aso/schemas";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "./sidebar";

function summary(overrides: Partial<ConversationSummary> = {}): ConversationSummary {
  return {
    id: "c1",
    title: "DigitPay",
    status: "completed",
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-06-12T00:00:00.000Z",
    ...overrides,
  };
}

const noop = {
  onSelect: vi.fn(),
  onNew: vi.fn(),
  onDelete: vi.fn(),
};

describe("Sidebar", () => {
  it("shows a loading message while loading", () => {
    render(<Sidebar conversations={[]} activeId={null} loading {...noop} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows an empty state when there are no conversations", () => {
    render(<Sidebar conversations={[]} activeId={null} loading={false} {...noop} />);
    expect(screen.getByText(/No audits yet/i)).toBeInTheDocument();
  });

  it("lists conversations and triggers onSelect on click", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <Sidebar
        conversations={[summary({ id: "c1", title: "DigitPay" })]}
        activeId={null}
        loading={false}
        {...noop}
        onSelect={onSelect}
      />,
    );
    await user.click(screen.getByText("DigitPay"));
    expect(onSelect).toHaveBeenCalledWith("c1");
  });

  it("triggers onDelete without selecting the conversation", async () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <Sidebar
        conversations={[summary({ id: "c1" })]}
        activeId={null}
        loading={false}
        {...noop}
        onSelect={onSelect}
        onDelete={onDelete}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete audit" }));
    expect(onDelete).toHaveBeenCalledWith("c1");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("triggers onNew when the new-audit button is clicked", async () => {
    const onNew = vi.fn();
    const user = userEvent.setup();
    render(
      <Sidebar conversations={[]} activeId={null} loading={false} {...noop} onNew={onNew} />,
    );
    await user.click(screen.getByRole("button", { name: /New audit/i }));
    expect(onNew).toHaveBeenCalledTimes(1);
  });

  it("renders a placeholder block when a conversation has no icon", () => {
    render(
      <Sidebar
        conversations={[summary({ iconUrl: undefined })]}
        activeId={null}
        loading={false}
        {...noop}
      />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
