"use client";

import type { ConversationSummary } from "@aso/schemas";
import { cn, timeAgo } from "@/lib/utils";

export function Sidebar({
  conversations,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950/60">
      <div className="flex items-center gap-2 px-4 pb-1 pt-4">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-400 to-sky-400 text-xs font-bold text-slate-900">
          A
        </span>
        <span className="text-sm font-semibold text-slate-200">ASO Audit Agent</span>
      </div>

      <div className="p-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
        >
          + New audit
        </button>
      </div>

      <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        Previous audits
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {loading ? (
          <p className="px-2 py-3 text-sm text-slate-500">Loading…</p>
        ) : conversations.length === 0 ? (
          <p className="px-2 py-3 text-sm text-slate-600">
            No audits yet. Paste an App Store link to start.
          </p>
        ) : (
          conversations.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition",
                c.id === activeId ? "bg-slate-800" : "hover:bg-slate-800/60",
              )}
              onClick={() => onSelect(c.id)}
            >
              {c.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.iconUrl} alt="" className="h-8 w-8 shrink-0 rounded-lg" />
              ) : (
                <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-800" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <StatusDot status={c.status} />
                  <span className="truncate text-slate-200">{c.title}</span>
                </div>
                <span className="text-xs text-slate-500">{timeAgo(c.updatedAt)}</span>
              </div>
              <button
                aria-label="Delete audit"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="opacity-0 transition group-hover:opacity-100 hover:text-rose-400 text-slate-500"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </nav>
    </aside>
  );
}

function StatusDot({ status }: { status: ConversationSummary["status"] }) {
  const color =
    status === "completed"
      ? "bg-emerald-400"
      : status === "failed"
        ? "bg-rose-400"
        : status === "running"
          ? "bg-amber-400 animate-pulse"
          : "bg-slate-500";
  return <span className={cn("h-2 w-2 shrink-0 rounded-full", color)} />;
}
