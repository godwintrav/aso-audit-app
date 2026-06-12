import type { ConversationSummary } from "@aso/schemas";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useConversations } from "./use-conversations";

vi.mock("./api", () => ({
  getConversations: vi.fn(),
  deleteConversation: vi.fn(),
}));

import { deleteConversation, getConversations } from "./api";

const getConversationsMock = vi.mocked(getConversations);
const deleteConversationMock = vi.mocked(deleteConversation);

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

beforeEach(() => {
  getConversationsMock.mockResolvedValue([summary()]);
  deleteConversationMock.mockResolvedValue();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useConversations", () => {
  it("loads conversations on mount and flips loading off", async () => {
    const { result } = renderHook(() => useConversations());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0].id).toBe("c1");
  });

  it("swallows load errors and still clears loading", async () => {
    getConversationsMock.mockRejectedValueOnce(new Error("network down"));
    const { result } = renderHook(() => useConversations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.conversations).toEqual([]);
  });

  it("re-fetches when refresh is called", async () => {
    const { result } = renderHook(() => useConversations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    getConversationsMock.mockResolvedValueOnce([summary({ id: "c2" }), summary({ id: "c3" })]);
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.conversations.map((c) => c.id)).toEqual(["c2", "c3"]);
  });

  it("removes a conversation optimistically after deletion succeeds", async () => {
    getConversationsMock.mockResolvedValueOnce([summary({ id: "c1" }), summary({ id: "c2" })]);
    const { result } = renderHook(() => useConversations());
    await waitFor(() => expect(result.current.conversations).toHaveLength(2));
    await act(async () => {
      await result.current.remove("c1");
    });
    expect(deleteConversationMock).toHaveBeenCalledWith("c1");
    expect(result.current.conversations.map((c) => c.id)).toEqual(["c2"]);
  });
});
