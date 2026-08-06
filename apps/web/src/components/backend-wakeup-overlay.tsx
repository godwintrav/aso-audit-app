"use client";

import type { BackendStatus } from "@/lib/use-backend-status";
import { Card, CardContent } from "./ui/primitives";

export function BackendWakeupOverlay({
  status,
  elapsedMs,
  onRetry,
}: {
  status: BackendStatus;
  elapsedMs: number;
  onRetry: () => void;
}) {
  const unreachable = status === "unreachable";
  const seconds = Math.floor(elapsedMs / 1000);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-6 backdrop-blur"
    >
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          {unreachable ? (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 text-lg text-rose-300">
              !
            </span>
          ) : (
            <span
              data-testid="wakeup-spinner"
              className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-400"
            />
          )}

          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              {unreachable ? "Can't reach the audit service" : "Waking up the audit service"}
            </h2>
            <p className="text-sm text-slate-400">
              {unreachable
                ? "The service didn't respond in time. It may still be starting — try again in a moment."
                : "The backend sleeps when idle and takes up to a minute to spin back up. Hang tight — your audit will start as soon as it's awake."}
            </p>
          </div>

          {unreachable ? (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
            >
              Try again
            </button>
          ) : (
            seconds > 0 && (
              <p className="text-xs tabular-nums text-slate-500">
                {seconds}s elapsed
              </p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
