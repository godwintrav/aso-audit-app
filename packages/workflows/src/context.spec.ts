import { RuntimeContext } from "@mastra/core/runtime-context";
import { describe, expect, it, vi } from "vitest";
import { PROGRESS_EMITTER_KEY, resolveEmit } from "./context";

describe("resolveEmit", () => {
  it("returns the emitter set on the runtime context", () => {
    const emit = vi.fn();
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(PROGRESS_EMITTER_KEY, emit);

    resolveEmit(runtimeContext)("acquire_metadata", "started", "go");
    expect(emit).toHaveBeenCalledWith("acquire_metadata", "started", "go");
  });

  it("falls back to a no-op when no emitter is provided", () => {
    const runtimeContext = new RuntimeContext();
    expect(() => resolveEmit(runtimeContext)("acquire_metadata", "completed")).not.toThrow();
  });

  it("exposes a stable runtime-context key", () => {
    expect(PROGRESS_EMITTER_KEY).toBe("progressEmitter");
  });
});
