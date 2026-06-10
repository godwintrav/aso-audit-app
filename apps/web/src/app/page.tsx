"use client";

import type { Conversation } from "@aso/schemas";
import { useCallback, useState } from "react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Sidebar } from "@/components/sidebar";
import { getConversation } from "@/lib/api";
import { useAudit } from "@/lib/use-audit";
import { useConversations } from "@/lib/use-conversations";

export default function Home() {
  const { conversations, loading, refresh, remove } = useConversations();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);

  const loadConversation = useCallback(async (id: string) => {
    setLoadingConversation(true);
    try {
      setActiveConversation(await getConversation(id));
    } finally {
      setLoadingConversation(false);
    }
  }, []);

  const audit = useAudit({
    onRunStarted: () => void refresh(),
    onRunFinished: (id) => {
      void refresh();
      setActiveId(id);
      void loadConversation(id);
    },
  });

  const startNew = useCallback(() => {
    audit.reset();
    setActiveId(null);
    setActiveConversation(null);
  }, [audit]);

  const selectConversation = useCallback(
    (id: string) => {
      audit.reset();
      setActiveId(id);
      void loadConversation(id);
    },
    [audit, loadConversation],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await remove(id);
      if (id === activeId) startNew();
    },
    [remove, activeId, startNew],
  );

  return (
    <div className="flex h-screen">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        loading={loading}
        onSelect={selectConversation}
        onNew={startNew}
        onDelete={handleDelete}
      />
      <ChatPanel
        activeConversation={activeId ? activeConversation : null}
        loadingConversation={loadingConversation}
        audit={audit.state}
        onSubmitUrl={audit.submitUrl}
        onConfirm={audit.confirm}
        onCancel={startNew}
      />
    </div>
  );
}
