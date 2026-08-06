import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  KEEPALIVE_INTERVAL_MS,
  OVERLAY_GRACE_MS,
  PROBE_INTERVAL_MS,
  WAKE_DEADLINE_MS,
  useBackendStatus,
} from "./use-backend-status";

vi.mock("./api", () => ({ checkHealth: vi.fn() }));

import { checkHealth } from "./api";

const checkHealthMock = vi.mocked(checkHealth);

beforeEach(() => {
  vi.useFakeTimers();
  checkHealthMock.mockResolvedValue(true);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

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
    checkHealthMock.mockResolvedValue(false);
    const { result } = renderHook(() => useBackendStatus());

    expect(result.current.status).toBe("checking");
    expect(result.current.blocking).toBe(false);

    await advance(0); // flush the in-flight probe so it settles inside the test
  });

  it("switches to waking and keeps probing until the API answers", async () => {
    checkHealthMock.mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValue(true);
    const { result } = renderHook(() => useBackendStatus());

    await advance(0);
    expect(result.current.status).toBe("waking");
    expect(result.current.blocking).toBe(true);

    await advance(PROBE_INTERVAL_MS);
    expect(result.current.status).toBe("waking");

    await advance(PROBE_INTERVAL_MS);
    expect(result.current.status).toBe("ready");
    expect(checkHealthMock).toHaveBeenCalledTimes(3);
    expect(result.current.blocking).toBe(false);
  });

  it("counts elapsed time while waking", async () => {
    checkHealthMock.mockResolvedValue(false);
    const { result } = renderHook(() => useBackendStatus());

    await advance(3_000);
    expect(result.current.elapsedMs).toBeGreaterThanOrEqual(3_000);
  });

  it("gives up after the wake deadline", async () => {
    checkHealthMock.mockResolvedValue(false);
    const { result } = renderHook(() => useBackendStatus());

    await advance(WAKE_DEADLINE_MS + PROBE_INTERVAL_MS);
    expect(result.current.status).toBe("unreachable");
    expect(result.current.blocking).toBe(true);

    const callsAtDeadline = checkHealthMock.mock.calls.length;
    await advance(PROBE_INTERVAL_MS * 5);
    expect(checkHealthMock).toHaveBeenCalledTimes(callsAtDeadline);
  });

  it("restarts probing when retry is called", async () => {
    checkHealthMock.mockResolvedValue(false);
    const { result } = renderHook(() => useBackendStatus());
    await advance(WAKE_DEADLINE_MS + PROBE_INTERVAL_MS);
    expect(result.current.status).toBe("unreachable");

    checkHealthMock.mockResolvedValue(true);
    act(() => result.current.retry());
    await advance(0);

    expect(result.current.status).toBe("ready");
    expect(result.current.elapsedMs).toBe(0);
  });

  it("latches everReady so a later sleep does not undo the first success", async () => {
    const { result } = renderHook(() => useBackendStatus());
    await advance(0);
    expect(result.current.everReady).toBe(true);

    checkHealthMock.mockResolvedValue(false);
    act(() => result.current.retry());
    await advance(0);

    expect(result.current.status).toBe("waking");
    expect(result.current.everReady).toBe(true);
  });

  it("stops probing once unmounted", async () => {
    checkHealthMock.mockResolvedValue(false);
    const { unmount } = renderHook(() => useBackendStatus());
    await advance(PROBE_INTERVAL_MS);

    unmount();
    const callsAtUnmount = checkHealthMock.mock.calls.length;
    await advance(PROBE_INTERVAL_MS * 4);

    expect(checkHealthMock).toHaveBeenCalledTimes(callsAtUnmount);
  });
});

describe("useBackendStatus keepalive", () => {
  it("pings on the keepalive interval while the tab is visible", async () => {
    const { result } = renderHook(() => useBackendStatus());
    await advance(0);
    expect(result.current.status).toBe("ready");

    checkHealthMock.mockClear();
    await advance(KEEPALIVE_INTERVAL_MS);
    expect(checkHealthMock).toHaveBeenCalledTimes(1);

    await advance(KEEPALIVE_INTERVAL_MS);
    expect(checkHealthMock).toHaveBeenCalledTimes(2);
  });

  it("skips the ping while the tab is hidden", async () => {
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    try {
      renderHook(() => useBackendStatus());
      await advance(0);
      checkHealthMock.mockClear();

      await advance(KEEPALIVE_INTERVAL_MS * 2);
      expect(checkHealthMock).not.toHaveBeenCalled();
    } finally {
      visibility.mockRestore();
    }
  });

  it("pings when the tab becomes visible again", async () => {
    renderHook(() => useBackendStatus());
    await advance(0);
    checkHealthMock.mockClear();

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(checkHealthMock).toHaveBeenCalledTimes(1);
  });

  it("does not ping before the API is known to be up", async () => {
    checkHealthMock.mockResolvedValue(false);
    renderHook(() => useBackendStatus());
    await advance(0);

    const probesOnly = checkHealthMock.mock.calls.length;
    await advance(PROBE_INTERVAL_MS - 1);
    expect(checkHealthMock).toHaveBeenCalledTimes(probesOnly);
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

    checkHealthMock.mockResolvedValueOnce(false).mockResolvedValue(true);
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

    checkHealthMock.mockResolvedValue(false);
    let resolved: boolean | undefined;
    act(() => {
      void result.current.ensureAwake().then((ok) => {
        resolved = ok;
      });
    });

    await advance(WAKE_DEADLINE_MS + PROBE_INTERVAL_MS);
    expect(resolved).toBe(false);
    expect(result.current.status).toBe("unreachable");
  });

  it("resolves false instead of hanging when the hook unmounts", async () => {
    checkHealthMock.mockResolvedValue(false);
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
