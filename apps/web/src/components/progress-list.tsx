"use client";

import type { AuditProgressEvent, AuditStage } from "@aso/schemas";
import { Card, CardContent } from "./ui/primitives";

/** Display order + labels for the audit stages (presentation only). */
const STAGES: { stage: AuditStage; label: string }[] = [
  { stage: "acquire_metadata", label: "Fetching app metadata" },
  { stage: "analyze_metadata", label: "Analyzing title, subtitle & description" },
  { stage: "analyze_screenshots", label: "Analyzing screenshots" },
  { stage: "analyze_reviews", label: "Analyzing reviews" },
  { stage: "analyze_competitors", label: "Finding competitors" },
  { stage: "generate_scores", label: "Generating scores" },
  { stage: "generate_recommendations", label: "Generating recommendations" },
  { stage: "assemble_report", label: "Building report" },
];

type StageStatus = "pending" | "active" | "done" | "failed";

function statusOf(stage: AuditStage, events: AuditProgressEvent[]): StageStatus {
  const forStage = events.filter((e) => e.stage === stage);
  if (forStage.some((e) => e.status === "completed")) return "done";
  if (forStage.some((e) => e.status === "failed")) return "failed";
  if (forStage.some((e) => e.status === "started")) return "active";
  return "pending";
}

export function ProgressList({ events }: { events: AuditProgressEvent[] }) {
  return (
    <Card>
      <CardContent>
        <ul className="space-y-3">
          {STAGES.map(({ stage, label }) => {
            const status = statusOf(stage, events);
            return (
              <li key={stage} className="flex items-center gap-3 text-sm">
                <StatusIcon status={status} />
                <span
                  className={
                    status === "pending"
                      ? "text-slate-500"
                      : status === "failed"
                        ? "text-rose-300"
                        : "text-slate-200"
                  }
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function StatusIcon({ status }: { status: StageStatus }) {
  if (status === "done")
    return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">✓</span>;
  if (status === "failed")
    return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-rose-300">!</span>;
  if (status === "active")
    return <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />;
  return <span className="h-5 w-5 rounded-full border border-slate-700" />;
}
