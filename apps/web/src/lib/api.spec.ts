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

describe("probe routing", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  /** Re-imports the module so the configured API origin is picked up. */
  async function loadWithApiUrl(url?: string) {
    vi.resetModules();
    if (url === undefined) vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    else vi.stubEnv("NEXT_PUBLIC_API_URL", url);
    return import("./api");
  }

  it("sends the wake probe straight to the API origin, not through the proxy", async () => {
    // Render refuses wake requests from the web service's egress, so this one
    // call has to originate from the user's own browser.
    const api = await loadWithApiUrl("https://api.example.com");
    fetchMock.mockResolvedValue(response({ status: 200, body: { status: "ok" } }));

    await api.probeHealth(1_000);

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/healthz");
  });

  it("falls back to the proxied path when no API origin is configured", async () => {
    const api = await loadWithApiUrl();
    fetchMock.mockResolvedValue(response({ status: 200, body: { status: "ok" } }));

    await api.probeHealth(1_000);

    expect(fetchMock.mock.calls[0][0]).toBe("/api/healthz");
  });

  it("keeps every other call on the proxy", async () => {
    const api = await loadWithApiUrl("https://api.example.com");
    fetchMock.mockResolvedValue(response({ status: 200, body: {} }));

    await api.previewApp("https://apps.apple.com/app/id1");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/audit/preview");
  });
});

describe("probeHealth", () => {
  it("reports awake only when the health contract comes back", async () => {
    fetchMock.mockResolvedValue(response({ status: 200, body: { status: "ok", uptime: 12 } }));
    expect(await probeHealth(1_000)).toBe(true);
  });

  it("does not mistake a non-JSON 2xx from an intermediary for a running API", async () => {
    fetchMock.mockResolvedValue(
      response({ status: 200, body: undefined, jsonThrows: true }),
    );
    expect(await probeHealth(1_000)).toBe(false);
  });

  it("does not treat an unrelated JSON payload as the health contract", async () => {
    fetchMock.mockResolvedValue(response({ status: 200, body: { message: "starting" } }));
    expect(await probeHealth(1_000)).toBe(false);
  });

  it("reports asleep on a gateway error from a cold host", async () => {
    fetchMock.mockResolvedValue(response({ status: 502 }));
    expect(await probeHealth(1_000)).toBe(false);
  });

  it("reports asleep instead of throwing on a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await probeHealth(1_000)).toBe(false);
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
      expect(await probe).toBe(false);
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
