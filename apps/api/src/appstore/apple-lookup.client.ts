import { Injectable, Logger } from "@nestjs/common";
import {
  type AppleLookupItem,
  AppleLookupItemSchema,
  AppleLookupResponseSchema,
} from "./apple-response.schema";

const ITUNES_BASE = "https://itunes.apple.com";

/** Raised when the iTunes API has no app for a given id. */
export class AppNotFoundError extends Error {
  constructor(appId: string) {
    super(`No App Store app found for id ${appId}.`);
    this.name = "AppNotFoundError";
  }
}

/**
 * Thin client over the public iTunes Lookup/Search API. No auth required.
 * Every response is validated with Zod before it leaves the client.
 */
@Injectable()
export class AppleLookupClient {
  private readonly logger = new Logger(AppleLookupClient.name);

  /** Looks up a single app by its numeric App Store id. */
  async lookup(appId: string, country = "us"): Promise<AppleLookupItem> {
    const items = await this.lookupMany([appId], country);
    const item = items[0];
    if (!item) throw new AppNotFoundError(appId);
    return item;
  }

  /** Looks up several apps in one request; invalid items are skipped. */
  async lookupMany(appIds: string[], country = "us"): Promise<AppleLookupItem[]> {
    if (appIds.length === 0) return [];
    const url = `${ITUNES_BASE}/lookup?id=${appIds.join(",")}&country=${country}&entity=software`;
    const raw = await this.getJson(url);
    const response = AppleLookupResponseSchema.parse(raw);
    return this.parseItems(response.results);
  }

  /** Searches apps by term (used as a fallback / for future features). */
  async search(term: string, country = "us", limit = 5): Promise<AppleLookupItem[]> {
    const url = `${ITUNES_BASE}/search?term=${encodeURIComponent(
      term,
    )}&country=${country}&entity=software&limit=${limit}`;
    const raw = await this.getJson(url);
    const response = AppleLookupResponseSchema.parse(raw);
    return this.parseItems(response.results);
  }

  private parseItems(results: unknown[]): AppleLookupItem[] {
    const items: AppleLookupItem[] = [];
    for (const result of results) {
      const parsed = AppleLookupItemSchema.safeParse(result);
      if (parsed.success) {
        items.push(parsed.data);
      } else {
        this.logger.warn(`Skipping malformed iTunes item: ${parsed.error.message}`);
      }
    }
    return items;
  }

  private async getJson(url: string): Promise<unknown> {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`iTunes API request failed (${res.status}) for ${url}`);
    }
    return res.json();
  }
}
