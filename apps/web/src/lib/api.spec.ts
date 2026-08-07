import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { previewApp, probeHealth } from "./api";

vi.mock("./session", () => ({ getSessionId: () => "test-session" }));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function response(init: {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
  /** Mimics a non-JSON body, such as an HTML page from the platform edge. */
  jsonThrows?: boolean;
}) {
  return {
    ok: init.status >= 200 && init.status < 300,
    status: init.status,
    headers: new Headers(init.headers),
    json: async () => {
      if (init.jsonThrows) throw new SyntaxError("Unexpected token < in JSON");
      return init.body ?? {};
    },
  };
}

describe("probeHealth", () => {
  it("reports awake only when the health contract comes back", async () => {
    fetchMock.mockResolvedValue(response({ status: 200, body: { status: "ok", uptime: 12 } }));
    expect(await probeHealth(1_000)).toEqual({ awake: true });
  });

  it("does not mistake a 2xx edge interstitial for a running API", async () => {
    // Render serves its own spin-up page for a sleeping instance; it is not JSON.
    fetchMock.mockResolvedValue(
      response({ status: 200, body: undefined, jsonThrows: true }),
    );
    expect(await probeHealth(1_000)).toEqual({ awake: false });
  });

  it("does not treat an unrelated JSON payload as the health contract", async () => {
    fetchMock.mockResolvedValue(response({ status: 200, body: { message: "starting" } }));
    expect(await probeHealth(1_000)).toEqual({ awake: false });
  });

  it("flags a refused wake so the caller can retreat instead of retrying", async () => {
    // Render's actual response for a hibernating instance being woken too often.
    fetchMock.mockResolvedValue(
      response({
        status: 429,
        headers: { "x-render-routing": "hibernate-rate-limited" },
        jsonThrows: true,
      }),
    );
    expect(await probeHealth(1_000)).toEqual({
      awake: false,
      rateLimited: true,
      retryAfterMs: undefined,
    });
  });

  it("reports the push-back delay when one is given", async () => {
    fetchMock.mockResolvedValue(response({ status: 429, headers: { "retry-after": "30" } }));
    expect(await probeHealth(1_000)).toEqual({
      awake: false,
      rateLimited: true,
      retryAfterMs: 30_000,
    });
  });

  it("reports asleep on a gateway error from a cold host", async () => {
    fetchMock.mockResolvedValue(response({ status: 502 }));
    expect(await probeHealth(1_000)).toEqual({ awake: false });
  });

  it("reports asleep instead of throwing on a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await probeHealth(1_000)).toEqual({ awake: false });
  });

  it("aborts the probe once the timeout elapses", async () => {
    vi.useFakeTimers();
    try {
      fetchMock.mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
          }),
      );
      const probe = probeHealth(5_000);
      await vi.advanceTimersByTimeAsync(5_000);
      expect(await probe).toEqual({ awake: false });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("previewApp", () => {
  it("surfaces a retry delay when the request is throttled", async () => {
    fetchMock.mockResolvedValue(response({ status: 429, headers: { "retry-after": "58" } }));
    await expect(previewApp("https://apps.apple.com/app/id1")).rejects.toThrow(
      "Too many audits in a short time. Try again in 58s.",
    );
  });

  it("falls back to a generic message when no retry delay is given", async () => {
    fetchMock.mockResolvedValue(response({ status: 429 }));
    await expect(previewApp("https://apps.apple.com/app/id1")).rejects.toThrow(
      "Too many audits in a short time. Try again in a moment.",
    );
  });

  it("prefers the server's message for other failures", async () => {
    fetchMock.mockResolvedValue(response({ status: 400, body: { message: "Invalid App Store URL" } }));
    await expect(previewApp("nope")).rejects.toThrow("Invalid App Store URL");
  });
});
