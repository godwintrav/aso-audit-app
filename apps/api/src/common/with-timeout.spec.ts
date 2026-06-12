import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TimeoutError, withTimeout } from "./with-timeout";

describe("withTimeout", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("resolves with the value when the promise settles in time", async () => {
    const result = withTimeout(Promise.resolve("ok"), 1000, "task");
    await vi.advanceTimersByTimeAsync(0);
    await expect(result).resolves.toBe("ok");
  });

  it("rejects with a TimeoutError when the budget is exceeded", async () => {
    const slow = new Promise((resolve) => setTimeout(() => resolve("late"), 5000));
    const result = withTimeout(slow, 1000, "slow task");
    const assertion = expect(result).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });
});
