import { Inject, Injectable, Logger } from "@nestjs/common";
import { Firecrawl } from "firecrawl";
import { APP_CONFIG } from "../config/config.module";
import type { AppConfig } from "../config/configuration";

export interface ScrapeResult {
  markdown: string;
}

/**
 * Wraps the Firecrawl SDK so the rest of the app depends on a tiny, typed
 * surface (`scrapeMarkdown`) rather than the SDK's shape directly.
 */
@Injectable()
export class FirecrawlClient {
  private readonly logger = new Logger(FirecrawlClient.name);
  private readonly client: Firecrawl;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.client = new Firecrawl({ apiKey: config.firecrawlApiKey });
  }

  /** Scrapes a URL and returns its markdown. Throws on failure (callers degrade). */
  async scrapeMarkdown(url: string): Promise<ScrapeResult> {
    const doc = (await this.client.scrape(url, {
      formats: ["markdown"],
      onlyMainContent: false,
    })) as { markdown?: string };

    if (!doc?.markdown || typeof doc.markdown !== "string") {
      throw new Error(`Firecrawl returned no markdown for ${url}`);
    }
    this.logger.debug(`Scraped ${doc.markdown.length} chars of markdown from ${url}`);
    return { markdown: doc.markdown };
  }
}
