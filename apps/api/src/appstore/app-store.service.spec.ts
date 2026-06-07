import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AppListingSchema } from "@aso/schemas";
import { describe, expect, it } from "vitest";
import type { AppleLookupClient } from "./apple-lookup.client";
import type { AppleLookupItem } from "./apple-response.schema";
import { AppStorePageParser } from "./app-store-page.parser";
import { AppStoreService } from "./app-store.service";
import type { FirecrawlClient } from "./firecrawl.client";

const markdown = (
  JSON.parse(
    readFileSync(resolve(process.cwd(), "firecrawl-response-json-example.json"), "utf8"),
  ) as { markdown: string }
).markdown;

function appleItem(overrides: Partial<AppleLookupItem> = {}): AppleLookupItem {
  return {
    trackId: 6747904851,
    trackName: "DigitPay",
    description: "Pay, save, earn and spend.",
    artistName: "Digitpay Finance",
    primaryGenreName: "Finance",
    artworkUrl512: "https://example.com/icon.png",
    screenshotUrls: ["https://example.com/1.png"],
    ipadScreenshotUrls: [],
    averageUserRating: 5,
    userRatingCount: 8,
    version: "2.0.4",
    releaseNotes: "Bug fixes",
    ...overrides,
  } as AppleLookupItem;
}

function makeService(opts: { firecrawlFails?: boolean }) {
  const apple = {
    lookup: async () => appleItem(),
    lookupMany: async (ids: string[]) =>
      ids.map((id) => appleItem({ trackId: Number(id), trackName: `Competitor ${id}` })),
  } as unknown as AppleLookupClient;

  const firecrawl = {
    scrapeMarkdown: async () => {
      if (opts.firecrawlFails) throw new Error("Firecrawl down");
      return { markdown };
    },
  } as unknown as FirecrawlClient;

  return new AppStoreService(apple, firecrawl, new AppStorePageParser());
}

const url = "https://apps.apple.com/ng/app/digitpay/id6747904851";

describe("AppStoreService", () => {
  it("getPreview maps Apple metadata to the confirmation card", async () => {
    const preview = await makeService({}).getPreview(url);
    expect(preview).toMatchObject({
      appId: "6747904851",
      country: "ng",
      title: "DigitPay",
      developer: "Digitpay Finance",
      category: "Finance",
    });
  });

  it("getListing normalizes Apple + Firecrawl into a valid AppListing", async () => {
    const listing = await makeService({}).getListing(url);
    expect(() => AppListingSchema.parse(listing)).not.toThrow();
    expect(listing.subtitle).toBe("Crypto payments to fiat");
    expect(listing.reviews.length).toBeGreaterThan(0);
    expect(listing.competitors.length).toBeGreaterThan(0);
    expect(listing.warnings).toEqual([]);
  });

  it("degrades to Apple-only data with a warning when Firecrawl fails", async () => {
    const listing = await makeService({ firecrawlFails: true }).getListing(url);
    expect(() => AppListingSchema.parse(listing)).not.toThrow();
    expect(listing.reviews).toEqual([]);
    expect(listing.competitors).toEqual([]);
    expect(listing.subtitle).toBeUndefined();
    expect(listing.warnings.length).toBeGreaterThan(0);
  });
});
