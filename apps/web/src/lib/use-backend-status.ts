"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { checkHealth } from "./api";

/**
 * `checking` — first probe in flight, nothing shown to the user yet.
 * `waking`   — at least one probe failed; the API is most likely cold-starting.
 * `ready`    — the API answered `/healthz`, requests can flow.
 * `unreachable` — still no answer after {@link WAKE_DEADLINE_MS}.
 */
export type BackendStatus = "checking" | "waking" | "ready" | "unreachable";

/** A cold Render instance can hold a connection open for a while before answering. */
export const PROBE_TIMEOUT_MS = 10_000;
/** Pause between probes, to avoid hammering the host while it boots. */
export const PROBE_INTERVAL_MS = 3_000;
/** Give up (and offer a retry) after this long. Render cold starts are ~30-60s. */
export const WAKE_DEADLINE_MS = 120_000;
/**
 * A warm API answers in tens of milliseconds; suppressing the overlay for this
 * long keeps the common case free of a loading flash.
 */
export const OVERLAY_GRACE_MS = 700;
/**
 * Render spins a free instance down after ~15 minutes of inactivity, so a ping
 * comfortably inside that window keeps an open tab's backend warm.
 */
export const KEEPALIVE_INTERVAL_MS = 10 * 60_000;

export interface BackendStatusState {
  status: BackendStatus;
  /** Time since the current wake attempt started, for a live counter in the UI. */
  elapsedMs: number;
  /** True once the app should be blocked behind the wake-up overlay. */
  blocking: boolean;
  /** True once the API has answered at least once during this page's lifetime. */
  everReady: boolean;
  /** Restart probing after giving up. */
  retry: () => void;
  /**
   * Re-runs the wake sequence and resolves once the API answers (`false` if it
   * never does). Call before a user action that must reach the backend — the
   * instance may have gone back to sleep since the page loaded.
   */
  ensureAwake: () => Promise<boolean>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Keeps probing the API until it responds, so the UI can tell the user the
 * backend is waking instead of letting their first real request fail.
 */
export function useBackendStatus(): BackendStatusState {
  const [status, setStatus] = useState<BackendStatus>("checking");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [gracePassed, setGracePassed] = useState(false);
  const [everReady, setEverReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const waiters = useRef<((awake: boolean) => void)[]>([]);

  /** Resolves every pending `ensureAwake()` call with the settled outcome. */
  const settle = useCallback((awake: boolean) => {
    for (const resolve of waiters.current.splice(0)) resolve(awake);
  }, []);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const ensureAwake = useCallback(() => {
    const awaited = new Promise<boolean>((resolve) => waiters.current.push(resolve));
    // Reuse the normal probe loop rather than a parallel code path: if the API
    // is still warm it settles within the grace period and nothing is shown.
    setAttempt((n) => n + 1);
    return awaited;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    setStatus("checking");
    setElapsedMs(0);
    setGracePassed(false);

    const grace = setTimeout(() => {
      if (!cancelled) setGracePassed(true);
    }, OVERLAY_GRACE_MS);

    const ticker = setInterval(() => {
      if (!cancelled) setElapsedMs(Date.now() - startedAt);
    }, 1_000);

    void (async () => {
      while (!cancelled) {
        const ok = await checkHealth(PROBE_TIMEOUT_MS);
        if (cancelled) return;
        if (ok) {
          setStatus("ready");
          setEverReady(true);
          settle(true);
          return;
        }
        if (Date.now() - startedAt >= WAKE_DEADLINE_MS) {
          setStatus("unreachable");
          settle(false);
          return;
        }
        setStatus("waking");
        await sleep(PROBE_INTERVAL_MS);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(grace);
      clearInterval(ticker);
    };
  }, [attempt]);

  // Never leave an `ensureAwake()` caller hanging on an unmounted hook. Attempt
  // changes are not covered here on purpose — the restarted loop settles those.
  useEffect(() => () => settle(false), [settle]);

  // Keep an open tab's instance warm so a long reading session doesn't end in a
  // cold start. Failures are deliberately not surfaced: interrupting the user
  // with an overlay they didn't ask for is worse than waking on their next
  // action, which `ensureAwake()` covers.
  useEffect(() => {
    if (status !== "ready") return;

    const ping = () => {
      if (document.visibilityState === "visible") void checkHealth(PROBE_TIMEOUT_MS);
    };
    const timer = setInterval(ping, KEEPALIVE_INTERVAL_MS);
    document.addEventListener("visibilitychange", ping);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", ping);
    };
  }, [status]);

  return {
    status,
    elapsedMs,
    everReady,
    ensureAwake,
    blocking: status !== "ready" && (status !== "checking" || gracePassed),
    retry,
  };
}
