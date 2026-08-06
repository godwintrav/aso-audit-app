"use client";

import type { Conversation } from "@aso/schemas";
import { useCallback, useState } from "react";
import { BackendWakeupOverlay } from "@/components/backend-wakeup-overlay";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Sidebar } from "@/components/sidebar";
import { getConversation } from "@/lib/api";
import { useAudit } from "@/lib/use-audit";
import { useBackendStatus } from "@/lib/use-backend-status";
import { useConversations } from "@/lib/use-conversations";

export default function Home() {
  const backend = useBackendStatus();
  const { conversations, loading, refresh, remove } = useConversations(backend.everReady);

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

  /**
   * The instance can sleep again while the tab sits open, so confirm it is
   * awake before the first request of a run rather than letting it fail.
   */
  const submitUrl = useCallback(
    async (url: string) => {
      if (await backend.ensureAwake()) await audit.submitUrl(url);
    },
    [backend, audit],
  );

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
      {backend.blocking && (
        <BackendWakeupOverlay
          status={backend.status}
          elapsedMs={backend.elapsedMs}
          onRetry={backend.retry}
        />
      )}
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
        onSubmitUrl={submitUrl}
        onConfirm={audit.confirm}
        onCancel={startNew}
      />
    </div>
  );
}
