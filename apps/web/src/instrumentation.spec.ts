import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { register } from "./instrumentation";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
  fetchMock.mockResolvedValue({ status: 200 });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("register", () => {
  it("starts waking the API as soon as the server boots", async () => {
    await register();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/healthz");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  });

  it("returns without waiting for the wake to finish", async () => {
    let settle!: () => void;
    fetchMock.mockReturnValue(
      new Promise<{ status: number }>((resolve) => {
        settle = () => resolve({ status: 200 });
      }),
    );

    // Resolving means startup was never blocked on the in-flight request.
    await expect(register()).resolves.toBeUndefined();
    settle();
  });

  it("does nothing on non-Node runtimes", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    await register();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing when no API URL is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    await register();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never lets a failed wake take down server startup", async () => {
    fetchMock.mockRejectedValue(new Error("connect ETIMEDOUT"));

    await expect(register()).resolves.toBeUndefined();
    await vi.waitFor(() => expect(console.warn).toHaveBeenCalled());
  });
});
