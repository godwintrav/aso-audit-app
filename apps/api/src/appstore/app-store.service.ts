import { Injectable, Logger } from "@nestjs/common";
import { MAX_COMPETITORS, parseAppStoreUrl } from "@aso/core";
import {
  type AppListing,
  AppListingSchema,
  type AuditPreview,
  type Competitor,
} from "@aso/schemas";
import { AppleLookupClient } from "./apple-lookup.client";
import type { AppleLookupItem } from "./apple-response.schema";
import { AppStorePageParser } from "./app-store-page.parser";
import { FirecrawlClient } from "./firecrawl.client";

/**
 * Acquires and normalizes app data from the two external sources into the
 * single `AppListing` domain model. The Apple metadata is required; the
 * Firecrawl-derived data (subtitle, reviews, competitors) is best-effort —
 * if it fails, the audit still proceeds with warnings recorded.
 */
@Injectable()
export class AppStoreService {
  private readonly logger = new Logger(AppStoreService.name);

  constructor(
    private readonly apple: AppleLookupClient,
    private readonly firecrawl: FirecrawlClient,
    private readonly parser: AppStorePageParser,
  ) {}

  /** Fast path for the confirmation card — Apple metadata only, no scraping. */
  async getPreview(url: string): Promise<AuditPreview> {
    const { appId, country, url: canonicalUrl } = parseAppStoreUrl(url);
    const item = await this.apple.lookup(appId, country);
    return {
      appId,
      country,
      url: canonicalUrl,
      title: item.trackName,
      developer: item.artistName,
      category: item.primaryGenreName,
      iconUrl: this.iconOf(item),
    };
  }

  /** Full acquisition: Apple metadata + Firecrawl content + competitor enrichment. */
  async getListing(url: string): Promise<AppListing> {
    const { appId, country, url: canonicalUrl } = parseAppStoreUrl(url);
    const item = await this.apple.lookup(appId, country);

    const warnings: string[] = [];
    let subtitle: string | undefined;
    let whatsNew: string | undefined = item.releaseNotes;
    let reviews: AppListing["reviews"] = [];
    let competitors: Competitor[] = [];

    try {
      const { markdown } = await this.firecrawl.scrapeMarkdown(canonicalUrl);
      const page = this.parser.parse(markdown);
      subtitle = page.subtitle;
      whatsNew = page.whatsNew ?? whatsNew;
      reviews = page.reviews;
      competitors = await this.enrichCompetitors(page.competitorCandidates, country);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Firecrawl acquisition failed for ${canonicalUrl}: ${message}`);
      warnings.push(
        "Could not fetch reviews, subtitle or competitors (Firecrawl unavailable); " +
          "the audit used Apple metadata only.",
      );
    }

    const listing: AppListing = {
      appId,
      country,
      url: canonicalUrl,
      title: item.trackName,
      subtitle,
      description: item.description,
      developer: item.artistName,
      category: item.primaryGenreName,
      iconUrl: this.iconOf(item),
      rating: round1(item.averageUserRating),
      ratingCount: item.userRatingCount,
      version: item.version,
      whatsNew,
      hasAppPreviewVideo: false,
      screenshots: this.screenshotsOf(item),
      reviews,
      competitors,
      warnings,
    };

    // Validate our own normalized output before it enters the workflow.
    return AppListingSchema.parse(listing);
  }

  private async enrichCompetitors(
    candidates: { appId: string; title: string }[],
    country: string,
  ): Promise<Competitor[]> {
    const top = candidates.slice(0, MAX_COMPETITORS);
    if (top.length === 0) return [];
    try {
      const items = await this.apple.lookupMany(
        top.map((c) => c.appId),
        country,
      );
      return items.map((item) => ({
        appId: String(item.trackId),
        title: item.trackName,
        developer: item.artistName,
        category: item.primaryGenreName,
        rating: round1(item.averageUserRating),
        ratingCount: item.userRatingCount,
        iconUrl: this.iconOf(item),
        screenshotCount: item.screenshotUrls.length,
      }));
    } catch (error) {
      this.logger.warn(
        `Competitor enrichment failed: ${error instanceof Error ? error.message : error}`,
      );
      // Fall back to the names/ids we already have.
      return top.map((c) => ({ appId: c.appId, title: c.title }));
    }
  }

  private iconOf(item: AppleLookupItem): string {
    return (
      item.artworkUrl512 ??
      item.artworkUrl100 ??
      item.artworkUrl60 ??
      "https://apps.apple.com/assets/favicon/favicon-32.png"
    );
  }

  private screenshotsOf(item: AppleLookupItem): string[] {
    return item.screenshotUrls.length > 0
      ? item.screenshotUrls
      : item.ipadScreenshotUrls;
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
