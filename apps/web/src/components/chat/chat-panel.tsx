"use client";

import type { Conversation } from "@aso/schemas";
import { useEffect, useRef } from "react";
import { ConfirmationCard } from "@/components/confirmation-card";
import { ProgressList } from "@/components/progress-list";
import { ReportView } from "@/components/report/report-view";
import { UrlInput } from "@/components/url-input";
import type { AuditState } from "@/lib/use-audit";
import { UserBubble, AssistantBubble } from "./bubbles";

interface ChatPanelProps {
  activeConversation: Conversation | null;
  loadingConversation: boolean;
  audit: AuditState;
  onSubmitUrl: (url: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ChatPanel(props: ChatPanelProps) {
  const { activeConversation, loadingConversation, audit } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const isEmpty = !activeConversation && !loadingConversation && audit.phase === "idle";

  // Follow live progress to the bottom; jump to the top when opening a past audit.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (activeConversation) el.scrollTo({ top: 0 });
    else el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [activeConversation, audit.phase, audit.events.length]);

  return (
    // The scroll lives on the full-width column so the scrollbar sits flush with
    // the window edge — content stays centered with symmetric margins.
    <section ref={scrollRef} className="h-full flex-1 overflow-y-auto">
      <div
        className={`mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 ${
          isEmpty ? "h-full" : "py-8"
        }`}
      >
        {loadingConversation ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading audit…</p>
        ) : activeConversation ? (
          <HistoryThread conversation={activeConversation} />
        ) : (
          <LiveThread {...props} />
        )}
      </div>
    </section>
  );
}

/** A past audit, re-rendered from the persisted conversation (no re-run). */
function HistoryThread({ conversation }: { conversation: Conversation }) {
  return (
    <>
      <UserBubble text={conversation.url} />
      {conversation.report ? (
        <AssistantBubble>
          <ReportView report={conversation.report} />
        </AssistantBubble>
      ) : conversation.status === "failed" ? (
        <AssistantBubble tone="error">
          {conversation.error ?? "This audit failed."}
        </AssistantBubble>
      ) : (
        <AssistantBubble>This audit is still in progress.</AssistantBubble>
      )}
    </>
  );
}

/** The live new-audit flow: composer → confirmation → progress → report. */
function LiveThread({ audit, onSubmitUrl, onConfirm, onCancel }: ChatPanelProps) {
  if (audit.phase === "idle") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
        <div>
          <h1 className="bg-gradient-to-r from-indigo-300 to-sky-300 bg-clip-text text-3xl font-bold text-transparent">
            ASO Audit Agent
          </h1>
          <p className="mt-2 text-slate-400">
            Paste an App Store link and get an AI-powered optimization audit.
          </p>
        </div>
        <div className="w-full max-w-xl">
          <UrlInput onSubmit={onSubmitUrl} loading={false} />
        </div>
      </div>
    );
  }

  return (
    <>
      {audit.url ? <UserBubble text={audit.url} /> : null}

      {audit.phase === "previewing" ? (
        <AssistantBubble>Looking up the app…</AssistantBubble>
      ) : null}

      {audit.phase === "confirm" && audit.preview ? (
        <AssistantBubble>
          <ConfirmationCard
            preview={audit.preview}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        </AssistantBubble>
      ) : null}

      {audit.phase === "running" ? (
        <AssistantBubble>
          <div className="space-y-3">
            <ProgressList events={audit.events} />
            <p className="text-xs text-slate-500">
              Running the audit — this usually takes 20–40 seconds.
            </p>
          </div>
        </AssistantBubble>
      ) : null}

      {audit.phase === "done" && audit.report ? (
        <AssistantBubble>
          <ReportView report={audit.report} />
        </AssistantBubble>
      ) : null}

      {audit.phase === "error" ? (
        <AssistantBubble tone="error">
          <p>{audit.error}</p>
          <button
            onClick={onCancel}
            className="mt-3 rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/20"
          >
            Start over
          </button>
        </AssistantBubble>
      ) : null}
    </>
  );
}
