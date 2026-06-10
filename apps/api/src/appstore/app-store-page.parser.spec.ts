import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AppStorePageParser } from "./app-store-page.parser";

const fixture = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "firecrawl-response-json-example.json"),
    "utf8",
  ),
) as { markdown: string };

const parser = new AppStorePageParser();

describe("AppStorePageParser (real Firecrawl fixture)", () => {
  const parsed = parser.parse(fixture.markdown);

  it("extracts the subtitle", () => {
    expect(parsed.subtitle).toBe("Crypto payments to fiat");
  });

  it("extracts review titles and bodies", () => {
    expect(parsed.reviews.length).toBeGreaterThanOrEqual(5);
    const titles = parsed.reviews.map((r) => r.title);
    expect(titles).toContain("Service Rendered is Top-notch");
    const first = parsed.reviews.find((r) => r.title === "The best so far");
    expect(first?.body).toContain("user interface");
  });

  it("extracts competitor candidates with app ids", () => {
    const ids = parsed.competitorCandidates.map((c) => c.appId);
    expect(ids).toContain("6708225786");
    expect(parsed.competitorCandidates.length).toBeGreaterThanOrEqual(5);
    const blockroll = parsed.competitorCandidates.find((c) => c.appId === "6708225786");
    expect(blockroll?.title).toBe("Blockroll");
  });

  it("extracts a What's New note", () => {
    expect(parsed.whatsNew).toBeTruthy();
  });

  it("returns empty results for empty markdown without throwing", () => {
    const empty = parser.parse("");
    expect(empty.reviews).toEqual([]);
    expect(empty.competitorCandidates).toEqual([]);
    expect(empty.subtitle).toBeUndefined();
  });
});
