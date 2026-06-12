import type { AnalysisGateway } from "@aso/agents";
import type { AppListing } from "@aso/schemas";
import { describe, expect, it, vi } from "vitest";
import { AUDIT_CONTEXT_KEY, createRunContext } from "./context";

const gateway = {} as AnalysisGateway;

function listing(): AppListing {
  return {
    appId: "1",
    country: "us",
    url: "https://apps.apple.com/us/app/id1",
    title: "DigitPay",
    description: "desc",
    developer: "Dev",
    category: "Finance",
    iconUrl: "https://example.com/icon.png",
    rating: 5,
    ratingCount: 8,
    hasAppPreviewVideo: false,
    screenshots: [],
    reviews: [],
    competitors: [],
    warnings: [],
  };
}

describe("createRunContext", () => {
  it("initializes results, dimensions, recommendations and report as empty", () => {
    const ctx = createRunContext({ listing: listing(), gateway });
    expect(ctx.listing.appId).toBe("1");
    expect(ctx.gateway).toBe(gateway);
    expect(ctx.results).toEqual({
      title: null,
      subtitle: null,
      description: null,
      screenshots: null,
      reviews: null,
      competitors: null,
    });
    expect(ctx.dimensions).toBeNull();
    expect(ctx.recommendations).toBeNull();
    expect(ctx.report).toBeNull();
  });

  it("uses the provided emit callback", () => {
    const emit = vi.fn();
    const ctx = createRunContext({ listing: listing(), gateway, emit });
    ctx.emit("acquire_metadata", "started", "go");
    expect(emit).toHaveBeenCalledWith("acquire_metadata", "started", "go");
  });

  it("defaults emit to a no-op that does not throw", () => {
    const ctx = createRunContext({ listing: listing(), gateway });
    expect(() => ctx.emit("acquire_metadata", "completed")).not.toThrow();
  });

  it("exposes a stable context key", () => {
    expect(AUDIT_CONTEXT_KEY).toBe("auditContext");
  });
});
