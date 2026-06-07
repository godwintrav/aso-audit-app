import { describe, expect, it } from "vitest";
import { AppListingSchema } from "./app-listing";
import { ConversationSchema } from "./conversation";
import { RecommendationSchema } from "./recommendation";

const validListing = {
  appId: "123",
  country: "us",
  url: "https://apps.apple.com/us/app/id123",
  title: "Example",
  description: "An example app.",
  developer: "Acme",
  category: "Finance",
  iconUrl: "https://example.com/icon.png",
  rating: 4.5,
  ratingCount: 100,
  screenshots: ["https://example.com/1.png"],
  reviews: [],
  competitors: [],
};

describe("AppListingSchema", () => {
  it("accepts a valid listing and applies defaults", () => {
    const parsed = AppListingSchema.parse(validListing);
    expect(parsed.hasAppPreviewVideo).toBe(false);
    expect(parsed.warnings).toEqual([]);
  });

  it("rejects an out-of-range rating", () => {
    expect(() => AppListingSchema.parse({ ...validListing, rating: 9 })).toThrow();
  });

  it("rejects a non-URL icon", () => {
    expect(() => AppListingSchema.parse({ ...validListing, iconUrl: "nope" })).toThrow();
  });
});

describe("ConversationSchema", () => {
  const base = {
    id: "c1",
    sessionId: "s1",
    url: "https://apps.apple.com/us/app/id1",
    title: "App",
    status: "running",
    preview: null,
    report: null,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("accepts a minimal running conversation", () => {
    expect(() => ConversationSchema.parse(base)).not.toThrow();
  });

  it("rejects an invalid status", () => {
    expect(() => ConversationSchema.parse({ ...base, status: "weird" })).toThrow();
  });
});

describe("RecommendationSchema", () => {
  it("validates effort and impact enums", () => {
    expect(() =>
      RecommendationSchema.parse({
        category: "quick_win",
        title: "x",
        evidence: "e",
        reason: "r",
        impact: "huge",
        effort: "low",
      }),
    ).toThrow();
  });
});
