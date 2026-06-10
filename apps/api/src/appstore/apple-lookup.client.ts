import { Injectable, Logger } from "@nestjs/common";
import {
  type AppleLookupItem,
  AppleLookupItemSchema,
  AppleLookupResponseSchema,
} from "./apple-response.schema";

const ITUNES_BASE = "https://itunes.apple.com";

export class AppNotFoundError extends Error {
  constructor(appId: string) {
    super(`No App Store app found for id ${appId}.`);
    this.name = "AppNotFoundError";
  }
}

@Injectable()
export class AppleLookupClient {
  private readonly logger = new Logger(AppleLookupClient.name);

  async lookup(appId: string, country = "us"): Promise<AppleLookupItem> {
    const items = await this.lookupMany([appId], country);
    const item = items[0];
    if (!item) throw new AppNotFoundError(appId);
    return item;
  }

  async lookupMany(appIds: string[], country = "us"): Promise<AppleLookupItem[]> {
    if (appIds.length === 0) return [];
    const url = `${ITUNES_BASE}/lookup?id=${appIds.join(",")}&country=${country}&entity=software`;
    const raw = await this.getJson(url);
    const response = AppleLookupResponseSchema.parse(raw);
    return this.parseItems(response.results);
  }

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
