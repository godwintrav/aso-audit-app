import { Inject, Injectable, Logger } from "@nestjs/common";
import { Firecrawl } from "firecrawl";
import { APP_CONFIG } from "../config/config.module";
import type { AppConfig } from "../config/configuration";
import { withTimeout } from "../common/with-timeout";

export interface ScrapeResult {
  markdown: string;
}


@Injectable()
export class FirecrawlClient {
  private readonly logger = new Logger(FirecrawlClient.name);
  private readonly client: Firecrawl;
  private readonly timeoutMs: number;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.client = new Firecrawl({ apiKey: config.firecrawlApiKey });
    this.timeoutMs = config.firecrawlTimeoutMs;
  }

  async scrapeMarkdown(url: string): Promise<ScrapeResult> {
    const doc = (await withTimeout(
      this.client.scrape(url, { formats: ["markdown"], onlyMainContent: false }),
      this.timeoutMs,
      "Firecrawl scrape",
    )) as { markdown?: string };

    if (!doc?.markdown || typeof doc.markdown !== "string") {
      throw new Error(`Firecrawl returned no markdown for ${url}`);
    }
    this.logger.debug(`Scraped ${doc.markdown.length} chars of markdown from ${url}`);
    return { markdown: doc.markdown };
  }
}
