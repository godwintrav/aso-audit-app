"use client";

import { useCallback, useEffect, useState } from "react";
import type { ConversationSummary } from "@aso/schemas";
import { deleteConversation, getConversations } from "./api";

/** Loads and maintains the session's audit history for the sidebar. */
export function useConversations() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setConversations(await getConversations());
    } catch {
      /* leave the current list in place on transient errors */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteConversation(id);
    setConversations((list) => list.filter((c) => c.id !== id));
  }, []);

  return { conversations, loading, refresh, remove };
}
