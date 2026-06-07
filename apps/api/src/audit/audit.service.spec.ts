import { type AnalysisGateway, createStubGateway } from "@aso/agents";
import type { AppListing } from "@aso/schemas";
import { describe, expect, it, vi } from "vitest";
import type { AppStoreService } from "../appstore/app-store.service";
import { AuditCacheService } from "../cache/audit-cache.service";
import { InMemoryCacheStore } from "../cache/cache-store";
import { ConversationService } from "../conversations/conversation.service";
import { InMemoryConversationStore } from "../conversations/conversation.store";
import type { AppConfig } from "../config/configuration";
import type { AuditEventsService } from "./audit-events.service";
import { AuditService } from "./audit.service";
import { InMemoryAuditStore } from "./audit.store";

const config = { cacheEnabled: true, cacheTtlMs: 60_000, cacheMaxEntries: 100 } as AppConfig;
const URL = "https://apps.apple.com/ng/app/digitpay/id6747904851";

function listing(): AppListing {
  return {
    appId: "6747904851",
    country: "ng",
    url: "https://apps.apple.com/ng/app/id6747904851",
    title: "DigitPay",
    subtitle: "Crypto payments to fiat",
    description: "Pay, save, earn and spend.",
    developer: "Digitpay Finance",
    category: "Finance",
    iconUrl: "https://example.com/icon.png",
    rating: 5,
    ratingCount: 8,
    hasAppPreviewVideo: false,
    screenshots: ["https://example.com/1.png"],
    reviews: [{ title: "Great", body: "Fast and reliable." }],
    competitors: [{ appId: "1", title: "Rival", rating: 4 }],
    warnings: [],
  };
}

function setup() {
  const store = new InMemoryAuditStore();
  const cache = new AuditCacheService(new InMemoryCacheStore({ maxEntries: 100 }), config);
  const events = { publish: vi.fn(), complete: vi.fn(), stream: vi.fn() } as unknown as AuditEventsService;
  const appStore = {
    getListing: vi.fn(async () => listing()),
    getPreview: vi.fn(async () => ({
      appId: "6747904851",
      country: "ng",
      url: "https://apps.apple.com/ng/app/id6747904851",
      title: "DigitPay",
      developer: "Digitpay Finance",
      category: "Finance",
      iconUrl: "https://example.com/icon.png",
    })),
  } as unknown as AppStoreService;

  const stub = createStubGateway();
  const gateway = { generateStructured: vi.fn(stub.generateStructured) } as unknown as AnalysisGateway;

  const conversations = new ConversationService(new InMemoryConversationStore(50));
  const service = new AuditService(appStore, events, cache, conversations, store, gateway);
  return { service, store, appStore, gateway, conversations };
}

async function waitForDone(store: InMemoryAuditStore, id: string, timeoutMs = 8_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const record = store.get(id);
    if (record && (record.status === "completed" || record.status === "failed")) return record;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error("timed out waiting for audit to finish");
}

describe("AuditService caching", () => {
  it("serves a repeat audit from cache without re-acquiring or calling the LLM", async () => {
    const { service, store, appStore, gateway } = setup();

    const first = service.startRun(URL);
    await waitForDone(store, first.auditId);
    const acquireCalls = (appStore.getListing as ReturnType<typeof vi.fn>).mock.calls.length;
    const llmCalls = (gateway.generateStructured as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(acquireCalls).toBe(1);
    expect(llmCalls).toBeGreaterThan(0);

    const second = service.startRun(URL);
    const secondRecord = await waitForDone(store, second.auditId);

    // No additional acquisition or LLM calls on the cache hit.
    expect((appStore.getListing as ReturnType<typeof vi.fn>).mock.calls.length).toBe(acquireCalls);
    expect((gateway.generateStructured as ReturnType<typeof vi.fn>).mock.calls.length).toBe(llmCalls);
    expect(secondRecord.status).toBe("completed");
    expect(secondRecord.report?.appId).toBe("6747904851");
  });

  it("records a session-scoped conversation that ends completed with the report", async () => {
    const { service, store, conversations } = setup();

    const run = service.startRun(URL, false, "session-A");
    // The history entry exists immediately (running), before the audit finishes.
    expect(conversations.list("session-A")).toHaveLength(1);
    expect(conversations.list("session-B")).toHaveLength(0);

    await waitForDone(store, run.auditId);

    const convo = conversations.get(run.auditId, "session-A");
    expect(convo?.status).toBe("completed");
    expect(convo?.report?.appId).toBe("6747904851");
    expect(convo?.title).toBe("DigitPay");
  });

  it("refresh=true bypasses the cache and recomputes", async () => {
    const { service, store, appStore, gateway } = setup();

    const first = service.startRun(URL);
    await waitForDone(store, first.auditId);
    const acquireCalls = (appStore.getListing as ReturnType<typeof vi.fn>).mock.calls.length;
    const llmCalls = (gateway.generateStructured as ReturnType<typeof vi.fn>).mock.calls.length;

    const second = service.startRun(URL, true);
    await waitForDone(store, second.auditId);

    expect((appStore.getListing as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(acquireCalls);
    expect((gateway.generateStructured as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(llmCalls);
  });

  it("preview is cached after the first call", async () => {
    const { service, appStore } = setup();
    const a = await service.preview(URL);
    const b = await service.preview(URL);
    expect(a.cached).toBe(false);
    expect(b.cached).toBe(true);
    expect((appStore.getPreview as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });
});
