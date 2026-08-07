import { describe, expect, it } from "vitest";
import { SessionThrottlerGuard } from "./session-throttler.guard";

type TrackerFn = (req: Record<string, unknown>) => Promise<string>;

/**
 * Only the tracking key is under test, so the guard is built without its
 * storage/reflector dependencies rather than wiring a whole Nest context.
 */
const getTracker = (
  Object.create(SessionThrottlerGuard.prototype) as {
    getTracker: TrackerFn;
  }
).getTracker.bind(Object.create(SessionThrottlerGuard.prototype)) as TrackerFn;

const request = (headers: Record<string, unknown>, ip?: string) => ({ headers, ip });

describe("SessionThrottlerGuard", () => {
  it("keys on the session header so proxied users get separate buckets", async () => {
    const a = await getTracker(request({ "x-session-id": "session-a" }));
    const b = await getTracker(request({ "x-session-id": "session-b" }));

    expect(a).toBe("session:session-a");
    expect(b).not.toBe(a);
  });

  it("trims the session header", async () => {
    expect(await getTracker(request({ "x-session-id": "  padded  " }))).toBe("session:padded");
  });

  it("takes the first value when the header is repeated", async () => {
    expect(await getTracker(request({ "x-session-id": ["first", "second"] }))).toBe(
      "session:first",
    );
  });

  it("falls back to the IP for callers without a session header", async () => {
    expect(await getTracker(request({}, "203.0.113.7"))).toBe("ip:203.0.113.7");
  });

  it("falls back to the IP when the session header is blank", async () => {
    expect(await getTracker(request({ "x-session-id": "   " }, "203.0.113.7"))).toBe(
      "ip:203.0.113.7",
    );
  });

  it("still produces a key when neither session nor IP is available", async () => {
    expect(await getTracker(request({}))).toBe("ip:unknown");
  });
});
