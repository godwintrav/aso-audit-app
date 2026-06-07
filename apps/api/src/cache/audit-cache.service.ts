import { Inject, Injectable, Logger } from "@nestjs/common";
import { parseAppStoreUrl } from "@aso/core";
import {
  type AppListing,
  AppListingSchema,
  type AuditPreview,
  AuditPreviewSchema,
  type AuditReport,
  AuditReportSchema,
} from "@aso/schemas";
import type { ZodType } from "zod";
import { APP_CONFIG } from "../config/config.module";
import type { AppConfig } from "../config/configuration";
import { CACHE_STORE, type ICacheStore } from "./cache-store";

type Namespace = "report" | "listing" | "preview";

/**
 * Typed, domain-facing cache for the audit pipeline. It owns the caching
 * policy (key derivation, TTL, validation, in-flight de-duplication) so the
 * acquisition/orchestration services stay free of caching concerns.
 *
 * Every cached value is RE-VALIDATED with its Zod schema on read: a corrupt or
 * shape-drifted entry is dropped rather than trusted — the same "never trust
 * data crossing a boundary" rule we apply to external APIs.
 */
@Injectable()
export class AuditCacheService {
  private readonly logger = new Logger(AuditCacheService.name);
  /** Shared promises for computations currently in flight, keyed by cache key. */
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(
    @Inject(CACHE_STORE) private readonly store: ICacheStore,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /** Normalizes any App Store URL for a given storefront to a stable cache key. */
  keyFor(url: string): string {
    const { appId, country } = parseAppStoreUrl(url);
    return `${appId}:${country}`;
  }

  getReport(url: string): AuditReport | undefined {
    return this.read("report", url, AuditReportSchema);
  }
  setReport(url: string, report: AuditReport): void {
    this.write("report", url, report);
  }

  getListing(url: string): AppListing | undefined {
    return this.read("listing", url, AppListingSchema);
  }
  setListing(url: string, listing: AppListing): void {
    this.write("listing", url, listing);
  }

  getPreview(url: string): AuditPreview | undefined {
    return this.read("preview", url, AuditPreviewSchema);
  }
  setPreview(url: string, preview: AuditPreview): void {
    this.write("preview", url, preview);
  }

  /**
   * Read-through with single-flight: returns a cached value, an in-flight
   * computation's result, or runs `factory` once and caches it. Concurrent
   * callers for the same key share one computation — so duplicate requests
   * never spend tokens/credits twice.
   */
  async getOrCompute<T>(
    namespace: Namespace,
    url: string,
    schema: ZodType<T>,
    factory: () => Promise<T>,
  ): Promise<T> {
    if (!this.config.cacheEnabled) return factory();

    const cached = this.read(namespace, url, schema);
    if (cached !== undefined) return cached;

    const dedupeKey = this.storeKey(namespace, url);
    const existing = this.inFlight.get(dedupeKey) as Promise<T> | undefined;
    if (existing) {
      this.logger.debug(`cache JOIN (in-flight) ${dedupeKey}`);
      return existing;
    }

    const promise = factory()
      .then((value) => {
        this.write(namespace, url, value);
        return value;
      })
      .finally(() => this.inFlight.delete(dedupeKey));

    this.inFlight.set(dedupeKey, promise);
    return promise;
  }

  /** Invalidate every namespace for an app (used by `refresh`). */
  invalidate(url: string): void {
    const key = this.keyFor(url);
    for (const ns of ["report", "listing", "preview"] as Namespace[]) {
      this.store.delete(`${ns}:${key}`);
    }
  }

  private read<T>(namespace: Namespace, url: string, schema: ZodType<T>): T | undefined {
    if (!this.config.cacheEnabled) return undefined;
    const key = this.storeKey(namespace, url);
    const raw = this.store.get<unknown>(key);
    if (raw === undefined) {
      this.logger.debug(`cache MISS ${key}`);
      return undefined;
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      this.logger.warn(`cache entry "${key}" failed re-validation; dropping`);
      this.store.delete(key);
      return undefined;
    }
    this.logger.debug(`cache HIT ${key}`);
    return parsed.data;
  }

  private write<T>(namespace: Namespace, url: string, value: T): void {
    if (!this.config.cacheEnabled) return;
    this.store.set(this.storeKey(namespace, url), value, this.config.cacheTtlMs);
  }

  private storeKey(namespace: Namespace, url: string): string {
    return `${namespace}:${this.keyFor(url)}`;
  }
}
