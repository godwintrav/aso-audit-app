"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { probeHealth } from "./api";

/**
 * `checking` — first probe in flight, nothing shown to the user yet.
 * `waking`   — at least one probe failed; the API is most likely cold-starting.
 * `ready`    — the API answered `/healthz`, requests can flow.
 * `unreachable` — still no answer after {@link WAKE_DEADLINE_MS}.
 */
export type BackendStatus = "checking" | "waking" | "ready" | "unreachable";

/**
 * Render does not reject requests to a sleeping instance — it holds the
 * connection open until the instance is up, then answers normally. Observed
 * cold starts on this service ranged from 42.6s to 63.7s, so the probe has to
 * be willing to wait out the slowest one with headroom to spare.
 *
 * A timeout shorter than the cold start aborts the very request that is doing
 * the waking, which is how the wake sequence ends up never succeeding.
 */
export const PROBE_TIMEOUT_MS = 90_000;
/**
 * Pause between probes. A probe that fails fast means the request never
 * reached a booting instance at all, so there is nothing to wait out gently.
 */
export const PROBE_INTERVAL_MS = 3_000;
/**
 * Give up (and offer a retry) after this long — room for two full-length
 * probes, so a single slow cold start is never mistaken for a dead service.
 */
export const WAKE_DEADLINE_MS = 240_000;
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
/**
 * Stop pinging once the user has been idle this long.
 *
 * Keeping the instance up is not free: a free plan bills instance-hours, and
 * each ping keeps both the web service and the API out of hibernation. A tab
 * left open and forgotten would otherwise burn the monthly allowance for no
 * one's benefit. Waking again costs the user a cold start, which is what
 * `ensureAwake()` exists to cover.
 */
export const KEEPALIVE_IDLE_CUTOFF_MS = 20 * 60_000;

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
        const awake = await probeHealth(PROBE_TIMEOUT_MS);
        if (cancelled) return;
        if (awake) {
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

  // Keep the instance warm for someone who is actually using the app, so a long
  // reading session doesn't end in a cold start — but only for as long as they
  // are still there, since staying awake spends metered instance-hours.
  // Failures are deliberately not surfaced: interrupting the user with an
  // overlay they didn't ask for is worse than waking on their next action,
  // which `ensureAwake()` covers.
  useEffect(() => {
    if (status !== "ready") return;

    let lastActivity = Date.now();
    const markActive = () => {
      lastActivity = Date.now();
    };

    const ping = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastActivity > KEEPALIVE_IDLE_CUTOFF_MS) return;
      void probeHealth(PROBE_TIMEOUT_MS);
    };

    const onVisibilityChange = () => {
      // Returning to the tab is itself a sign of use.
      if (document.visibilityState === "visible") markActive();
      ping();
    };

    const timer = setInterval(ping, KEEPALIVE_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("pointerdown", markActive);
    document.addEventListener("keydown", markActive);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("pointerdown", markActive);
      document.removeEventListener("keydown", markActive);
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
