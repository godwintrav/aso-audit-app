import { Logger } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppConfig } from "../config/configuration";
import { AppleLookupClient, AppNotFoundError } from "./apple-lookup.client";

const config = { httpTimeoutMs: 20_000 } as AppConfig;

const validItem = {
  trackId: 6747904851,
  trackName: "DigitPay",
  description: "Pay, save, earn and spend.",
  artistName: "Digitpay Finance",
  primaryGenreName: "Finance",
  screenshotUrls: ["https://example.com/1.png"],
  averageUserRating: 5,
  userRatingCount: 8,
  trackViewUrl: "https://apps.apple.com/us/app/id6747904851",
};

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

function mockFetch(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(okResponse(body));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AppleLookupClient.lookup", () => {
  it("returns the first matching item", async () => {
    mockFetch({ resultCount: 1, results: [validItem] });
    const item = await new AppleLookupClient(config).lookup("6747904851");
    expect(item.trackName).toBe("DigitPay");
  });

  it("throws AppNotFoundError when no results are returned", async () => {
    mockFetch({ resultCount: 0, results: [] });
    await expect(new AppleLookupClient(config).lookup("0")).rejects.toThrow(AppNotFoundError);
  });
});

describe("AppleLookupClient.lookupMany", () => {
  it("returns an empty array without calling fetch for no ids", async () => {
    const fetchMock = mockFetch({ resultCount: 0, results: [] });
    const items = await new AppleLookupClient(config).lookupMany([]);
    expect(items).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requests the lookup endpoint with the joined ids and country", async () => {
    const fetchMock = mockFetch({ resultCount: 1, results: [validItem] });
    await new AppleLookupClient(config).lookupMany(["1", "2"], "ng");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/lookup?id=1,2");
    expect(url).toContain("country=ng");
  });

  it("skips malformed items but keeps valid ones", async () => {
    mockFetch({ resultCount: 2, results: [validItem, { trackId: "not-a-number" }] });
    const items = await new AppleLookupClient(config).lookupMany(["1", "2"]);
    expect(items).toHaveLength(1);
    expect(items[0].trackId).toBe(6747904851);
  });
});

describe("AppleLookupClient.search", () => {
  it("URL-encodes the search term and applies the limit", async () => {
    const fetchMock = mockFetch({ resultCount: 1, results: [validItem] });
    await new AppleLookupClient(config).search("crypto wallet", "us", 3);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/search?term=crypto%20wallet");
    expect(url).toContain("limit=3");
  });
});

describe("AppleLookupClient error handling", () => {
  it("throws when the iTunes API responds with a non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) } as unknown as Response),
    );
    await expect(new AppleLookupClient(config).lookup("1")).rejects.toThrow(/iTunes API request failed \(503\)/);
  });
});
