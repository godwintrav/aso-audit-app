"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AuditPreview,
  AuditProgressEvent,
  AuditReport,
} from "@aso/schemas";
import { getAudit, previewApp, startAudit, streamAudit } from "./api";

export type AuditPhase =
  | "idle"
  | "previewing"
  | "confirm"
  | "running"
  | "done"
  | "error";

export interface AuditState {
  phase: AuditPhase;
  auditId: string | null;
  url: string | null;
  preview: AuditPreview | null;
  events: AuditProgressEvent[];
  report: AuditReport | null;
  error: string | null;
}

const INITIAL: AuditState = {
  phase: "idle",
  auditId: null,
  url: null,
  preview: null,
  events: [],
  report: null,
  error: null,
};

export interface UseAuditOptions {
  /** Fired when a run is accepted (id known) — used to surface it in history. */
  onRunStarted?: (auditId: string) => void;
  /** Fired when a run reaches a terminal state (completed or failed). */
  onRunFinished?: (auditId: string) => void;
}

/** Drives a single live audit: preview → confirm → stream → report. */
export function useAudit(options: UseAuditOptions = {}) {
  const [state, setState] = useState<AuditState>(INITIAL);
  const stateRef = useRef(state);
  const optionsRef = useRef(options);
  const unsubscribe = useRef<(() => void) | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    optionsRef.current = options;
  });
  useEffect(() => () => unsubscribe.current?.(), []);

  const reset = useCallback(() => {
    unsubscribe.current?.();
    unsubscribe.current = null;
    setState(INITIAL);
  }, []);

  const submitUrl = useCallback(async (url: string) => {
    setState({ ...INITIAL, phase: "previewing", url });
    try {
      const preview = await previewApp(url);
      setState({ ...INITIAL, phase: "confirm", url, preview });
    } catch (error) {
      setState({ ...INITIAL, phase: "error", url, error: messageOf(error) });
    }
  }, []);

  const finalize = useCallback(async (auditId: string) => {
    try {
      const record = await getAudit(auditId);
      if (record.status === "running") return;
      unsubscribe.current?.();
      unsubscribe.current = null;
      if (record.status === "failed") {
        setState((s) => ({ ...s, phase: "error", error: record.error ?? "Audit failed." }));
      } else if (record.report) {
        setState((s) => ({ ...s, phase: "done", report: record.report }));
      }
      optionsRef.current.onRunFinished?.(auditId);
    } catch (error) {
      setState((s) => ({ ...s, phase: "error", error: messageOf(error) }));
    }
  }, []);

  const confirm = useCallback(async () => {
    const { preview } = stateRef.current;
    if (!preview) return;
    setState((s) => ({ ...s, phase: "running", events: [] }));
    try {
      const { auditId } = await startAudit(preview.url);
      setState((s) => ({ ...s, auditId }));
      optionsRef.current.onRunStarted?.(auditId);
      unsubscribe.current = streamAudit(auditId, {
        onEvent: (event) => {
          setState((s) => ({ ...s, events: [...s.events, event] }));
          const finished =
            (event.stage === "assemble_report" && event.status === "completed") ||
            event.status === "failed";
          if (finished) void finalize(auditId);
        },
        onError: () => void finalize(auditId),
      });
    } catch (error) {
      setState((s) => ({ ...s, phase: "error", error: messageOf(error) }));
    }
  }, [finalize]);

  return { state, submitUrl, confirm, reset };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
