import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  KEEPALIVE_IDLE_CUTOFF_MS,
  KEEPALIVE_INTERVAL_MS,
  MAX_PROBE_INTERVAL_MS,
  OVERLAY_GRACE_MS,
  PROBE_BACKOFF_FACTOR,
  PROBE_INTERVAL_MS,
  RATE_LIMITED_BACKOFF_MS,
  WAKE_DEADLINE_MS,
  useBackendStatus,
} from "./use-backend-status";

vi.mock("./api", () => ({ probeHealth: vi.fn() }));

import { probeHealth } from "./api";

const probeHealthMock = vi.mocked(probeHealth);

const AWAKE = { awake: true } as const;
const ASLEEP = { awake: false } as const;

beforeEach(() => {
  vi.useFakeTimers();
  probeHealthMock.mockResolvedValue(AWAKE);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

/**
 * The deadline is only checked after a probe returns, so giving up can lag it
 * by up to one backed-off interval.
 */
const PAST_DEADLINE = WAKE_DEADLINE_MS + MAX_PROBE_INTERVAL_MS * 2;

/** Advances fake timers while letting pending promises settle. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("useBackendStatus", () => {
  it("reports ready without ever blocking when the API is already warm", async () => {
    const { result } = renderHook(() => useBackendStatus());

    await advance(0);
    expect(result.current.status).toBe("ready");

    await advance(OVERLAY_GRACE_MS + 100);
    expect(result.current.blocking).toBe(false);
  });

  it("does not block during the grace period of the first probe", async () => {
    probeHealthMock.mockResolvedValue(ASLEEP);
    const { result } = renderHook(() => useBackendStatus());

    expect(result.current.status).toBe("checking");
    expect(result.current.blocking).toBe(false);

    await advance(0); // flush the in-flight probe so it settles inside the test
  });

  it("switches to waking and keeps probing until the API answers", async () => {
    probeHealthMock.mockResolvedValueOnce(ASLEEP).mockResolvedValueOnce(ASLEEP).mockResolvedValue(AWAKE);
    const { result } = renderHook(() => useBackendStatus());

    await advance(0);
    expect(result.current.status).toBe("waking");
    expect(result.current.blocking).toBe(true);

    await advance(PROBE_INTERVAL_MS);
    expect(result.current.status).toBe("waking");

    await advance(PROBE_INTERVAL_MS * PROBE_BACKOFF_FACTOR);
    expect(result.current.status).toBe("ready");
    expect(probeHealthMock).toHaveBeenCalledTimes(3);
    expect(result.current.blocking).toBe(false);
  });

  it("eases off between probes instead of polling at a fixed rate", async () => {
    probeHealthMock.mockResolvedValue(ASLEEP);
    renderHook(() => useBackendStatus());

    await advance(0);
    expect(probeHealthMock).toHaveBeenCalledTimes(1);

    // Second probe lands one interval later, the third only after the backoff.
    await advance(PROBE_INTERVAL_MS);
    expect(probeHealthMock).toHaveBeenCalledTimes(2);

    await advance(PROBE_INTERVAL_MS);
    expect(probeHealthMock).toHaveBeenCalledTimes(2);

    await advance(PROBE_INTERVAL_MS * PROBE_BACKOFF_FACTOR - PROBE_INTERVAL_MS);
    expect(probeHealthMock).toHaveBeenCalledTimes(3);
  });

  it("never backs off past the ceiling", async () => {
    probeHealthMock.mockResolvedValue(ASLEEP);
    renderHook(() => useBackendStatus());

    await advance(60_000);
    const calls = probeHealthMock.mock.calls.length;

    await advance(MAX_PROBE_INTERVAL_MS);
    expect(probeHealthMock.mock.calls.length).toBeGreaterThan(calls);
  });

  it("waits for the delay the host asked for when it pushes back", async () => {
    probeHealthMock.mockResolvedValue({ awake: false, retryAfterMs: 30_000 });
    renderHook(() => useBackendStatus());

    await advance(0);
    expect(probeHealthMock).toHaveBeenCalledTimes(1);

    // The ordinary backoff would have fired several probes by now.
    await advance(20_000);
    expect(probeHealthMock).toHaveBeenCalledTimes(1);

    await advance(10_000);
    expect(probeHealthMock).toHaveBeenCalledTimes(2);
  });

  it("retreats hard when the platform refuses to wake the instance", async () => {
    // Render answers `hibernate-rate-limited` with no Retry-After; retrying on
    // the ordinary cadence would just renew the refusal.
    probeHealthMock.mockResolvedValue({ awake: false, rateLimited: true });
    renderHook(() => useBackendStatus());

    await advance(0);
    expect(probeHealthMock).toHaveBeenCalledTimes(1);

    await advance(MAX_PROBE_INTERVAL_MS);
    expect(probeHealthMock).toHaveBeenCalledTimes(1);

    await advance(RATE_LIMITED_BACKOFF_MS - MAX_PROBE_INTERVAL_MS);
    expect(probeHealthMock).toHaveBeenCalledTimes(2);
  });

  it("still prefers an explicit Retry-After over the refusal backoff", async () => {
    probeHealthMock.mockResolvedValue({
      awake: false,
      rateLimited: true,
      retryAfterMs: 5_000,
    });
    renderHook(() => useBackendStatus());

    await advance(0);
    await advance(5_000);
    expect(probeHealthMock).toHaveBeenCalledTimes(2);
  });

  it("counts elapsed time while waking", async () => {
    probeHealthMock.mockResolvedValue(ASLEEP);
    const { result } = renderHook(() => useBackendStatus());

    await advance(3_000);
    expect(result.current.elapsedMs).toBeGreaterThanOrEqual(3_000);
  });

  it("gives up after the wake deadline", async () => {
    probeHealthMock.mockResolvedValue(ASLEEP);
    const { result } = renderHook(() => useBackendStatus());

    await advance(PAST_DEADLINE);
    expect(result.current.status).toBe("unreachable");
    expect(result.current.blocking).toBe(true);

    const callsAtDeadline = probeHealthMock.mock.calls.length;
    await advance(PROBE_INTERVAL_MS * 5);
    expect(probeHealthMock).toHaveBeenCalledTimes(callsAtDeadline);
  });

  it("restarts probing when retry is called", async () => {
    probeHealthMock.mockResolvedValue(ASLEEP);
    const { result } = renderHook(() => useBackendStatus());
    await advance(PAST_DEADLINE);
    expect(result.current.status).toBe("unreachable");

    probeHealthMock.mockResolvedValue(AWAKE);
    act(() => result.current.retry());
    await advance(0);

    expect(result.current.status).toBe("ready");
    expect(result.current.elapsedMs).toBe(0);
  });

  it("latches everReady so a later sleep does not undo the first success", async () => {
    const { result } = renderHook(() => useBackendStatus());
    await advance(0);
    expect(result.current.everReady).toBe(true);

    probeHealthMock.mockResolvedValue(ASLEEP);
    act(() => result.current.retry());
    await advance(0);

    expect(result.current.status).toBe("waking");
    expect(result.current.everReady).toBe(true);
  });

  it("stops probing once unmounted", async () => {
    probeHealthMock.mockResolvedValue(ASLEEP);
    const { unmount } = renderHook(() => useBackendStatus());
    await advance(PROBE_INTERVAL_MS);

    unmount();
    const callsAtUnmount = probeHealthMock.mock.calls.length;
    await advance(PROBE_INTERVAL_MS * 4);

    expect(probeHealthMock).toHaveBeenCalledTimes(callsAtUnmount);
  });
});

describe("useBackendStatus keepalive", () => {
  it("pings on the keepalive interval while the tab is visible", async () => {
    const { result } = renderHook(() => useBackendStatus());
    await advance(0);
    expect(result.current.status).toBe("ready");

    probeHealthMock.mockClear();
    await advance(KEEPALIVE_INTERVAL_MS);
    expect(probeHealthMock).toHaveBeenCalledTimes(1);

    await advance(KEEPALIVE_INTERVAL_MS);
    expect(probeHealthMock).toHaveBeenCalledTimes(2);
  });

  it("skips the ping while the tab is hidden", async () => {
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    try {
      renderHook(() => useBackendStatus());
      await advance(0);
      probeHealthMock.mockClear();

      await advance(KEEPALIVE_INTERVAL_MS * 2);
      expect(probeHealthMock).not.toHaveBeenCalled();
    } finally {
      visibility.mockRestore();
    }
  });

  it("pings when the tab becomes visible again", async () => {
    renderHook(() => useBackendStatus());
    await advance(0);
    probeHealthMock.mockClear();

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(probeHealthMock).toHaveBeenCalledTimes(1);
  });

  it("stops pinging once the user has gone idle, to stop burning instance-hours", async () => {
    renderHook(() => useBackendStatus());
    await advance(0);
    probeHealthMock.mockClear();

    await advance(KEEPALIVE_INTERVAL_MS);
    expect(probeHealthMock).toHaveBeenCalledTimes(1);

    // Past the idle cutoff with no interaction, the pings stop entirely.
    await advance(KEEPALIVE_IDLE_CUTOFF_MS);
    const callsAtCutoff = probeHealthMock.mock.calls.length;
    await advance(KEEPALIVE_INTERVAL_MS * 3);
    expect(probeHealthMock).toHaveBeenCalledTimes(callsAtCutoff);
  });

  it("resumes pinging when the user interacts again", async () => {
    renderHook(() => useBackendStatus());
    await advance(0);

    await advance(KEEPALIVE_IDLE_CUTOFF_MS + KEEPALIVE_INTERVAL_MS * 2);
    probeHealthMock.mockClear();

    await act(async () => {
      document.dispatchEvent(new Event("pointerdown"));
    });
    await advance(KEEPALIVE_INTERVAL_MS);

    expect(probeHealthMock).toHaveBeenCalledTimes(1);
  });

  it("counts returning to the tab as activity", async () => {
    renderHook(() => useBackendStatus());
    await advance(0);

    await advance(KEEPALIVE_IDLE_CUTOFF_MS + KEEPALIVE_INTERVAL_MS * 2);
    probeHealthMock.mockClear();

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(probeHealthMock).toHaveBeenCalledTimes(1);
  });

  it("does not ping before the API is known to be up", async () => {
    probeHealthMock.mockResolvedValue(ASLEEP);
    renderHook(() => useBackendStatus());
    await advance(0);

    const probesOnly = probeHealthMock.mock.calls.length;
    await advance(PROBE_INTERVAL_MS - 1);
    expect(probeHealthMock).toHaveBeenCalledTimes(probesOnly);
  });
});

describe("useBackendStatus ensureAwake", () => {
  it("resolves true when the API answers", async () => {
    const { result } = renderHook(() => useBackendStatus());
    await advance(0);

    let resolved: boolean | undefined;
    await act(async () => {
      void result.current.ensureAwake().then((ok) => {
        resolved = ok;
      });
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(resolved).toBe(true);
  });

  it("wakes a backend that went back to sleep and blocks the UI meanwhile", async () => {
    const { result } = renderHook(() => useBackendStatus());
    await advance(0);
    expect(result.current.status).toBe("ready");

    probeHealthMock.mockResolvedValueOnce(ASLEEP).mockResolvedValue(AWAKE);
    let resolved: boolean | undefined;
    act(() => {
      void result.current.ensureAwake().then((ok) => {
        resolved = ok;
      });
    });

    await advance(0);
    expect(result.current.status).toBe("waking");
    expect(result.current.blocking).toBe(true);
    expect(resolved).toBeUndefined();

    await advance(PROBE_INTERVAL_MS);
    expect(resolved).toBe(true);
    expect(result.current.status).toBe("ready");
  });

  it("resolves false when the backend never comes back", async () => {
    const { result } = renderHook(() => useBackendStatus());
    await advance(0);

    probeHealthMock.mockResolvedValue(ASLEEP);
    let resolved: boolean | undefined;
    act(() => {
      void result.current.ensureAwake().then((ok) => {
        resolved = ok;
      });
    });

    await advance(PAST_DEADLINE);
    expect(resolved).toBe(false);
    expect(result.current.status).toBe("unreachable");
  });

  it("resolves false instead of hanging when the hook unmounts", async () => {
    probeHealthMock.mockResolvedValue(ASLEEP);
    const { result, unmount } = renderHook(() => useBackendStatus());

    let resolved: boolean | undefined;
    act(() => {
      void result.current.ensureAwake().then((ok) => {
        resolved = ok;
      });
    });

    unmount();
    await advance(0);
    expect(resolved).toBe(false);
  });
});
