import { AuditPreviewSchema, type AuditPreview } from "@aso/schemas";
import { describe, expect, it, vi } from "vitest";
import type { AppConfig } from "../config/configuration";
import { AuditCacheService } from "./audit-cache.service";
import { InMemoryCacheStore } from "./cache-store";

const config = {
  cacheEnabled: true,
  cacheTtlMs: 60_000,
  cacheMaxEntries: 100,
} as AppConfig;

function makeService(overrides: Partial<AppConfig> = {}) {
  const store = new InMemoryCacheStore({ maxEntries: 100 });
  const service = new AuditCacheService(store, { ...config, ...overrides });
  return { store, service };
}

function preview(appId = "123"): AuditPreview {
  return {
    appId,
    country: "us",
    url: `https://apps.apple.com/us/app/id${appId}`,
    title: "Foo",
    developer: "Acme",
    category: "Finance",
    iconUrl: "https://example.com/icon.png",
  };
}

const URL_A = "https://apps.apple.com/us/app/foo/id123";
const URL_A_ALT = "https://apps.apple.com/us/app/bar/id123?mt=8#reviews";

describe("AuditCacheService", () => {
  it("derives the same key for different URL forms of the same app/storefront", () => {
    const { service } = makeService();
    expect(service.keyFor(URL_A)).toBe(service.keyFor(URL_A_ALT));
    expect(service.keyFor(URL_A)).toBe("123:us");
  });

  it("stores and reads back a preview, and collides on equivalent URLs", () => {
    const { service } = makeService();
    service.setPreview(URL_A, preview());
    expect(service.getPreview(URL_A_ALT)).toEqual(preview());
  });

  it("read-through caches: factory runs on miss, not on hit", async () => {
    const { service } = makeService();
    const factory = vi.fn(async () => preview());

    const first = await service.getOrCompute("preview", URL_A, AuditPreviewSchema, factory);
    const second = await service.getOrCompute("preview", URL_A, AuditPreviewSchema, factory);

    expect(first).toEqual(preview());
    expect(second).toEqual(preview());
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("de-duplicates concurrent computations (single-flight)", async () => {
    const { service } = makeService();
    let resolve!: (p: AuditPreview) => void;
    const factory = vi.fn(() => new Promise<AuditPreview>((r) => (resolve = r)));

    const p1 = service.getOrCompute("preview", URL_A, AuditPreviewSchema, factory);
    const p2 = service.getOrCompute("preview", URL_A, AuditPreviewSchema, factory);
    resolve(preview());
    await Promise.all([p1, p2]);

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("drops a cache entry that fails re-validation", () => {
    const { store, service } = makeService();
    store.set("preview:123:us", { garbage: true }, 60_000);
    expect(service.getPreview(URL_A)).toBeUndefined();
    expect(store.get("preview:123:us")).toBeUndefined(); // purged
  });

  it("bypasses entirely when caching is disabled", async () => {
    const { service } = makeService({ cacheEnabled: false });
    const factory = vi.fn(async () => preview());
    await service.getOrCompute("preview", URL_A, AuditPreviewSchema, factory);
    await service.getOrCompute("preview", URL_A, AuditPreviewSchema, factory);
    expect(factory).toHaveBeenCalledTimes(2); // no caching
  });

  it("invalidate clears all namespaces for an app", () => {
    const { store, service } = makeService();
    service.setPreview(URL_A, preview());
    service.invalidate(URL_A);
    expect(store.get("preview:123:us")).toBeUndefined();
  });
});
