"use client";

import { useCallback, useEffect, useState } from "react";
import type { ConversationSummary } from "@aso/schemas";
import { deleteConversation, getConversations } from "./api";

/**
 * @param enabled defer the initial load until the API is reachable (see
 * `useBackendStatus`), so a cold backend doesn't turn into an empty sidebar.
 */
export function useConversations(enabled = true) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setConversations(await getConversations());
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteConversation(id);
    setConversations((list) => list.filter((c) => c.id !== id));
  }, []);

  return { conversations, loading, refresh, remove };
}
