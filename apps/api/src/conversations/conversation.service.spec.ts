import type { AuditPreview, AuditReport } from "@aso/schemas";
import { describe, expect, it } from "vitest";
import { ConversationService } from "./conversation.service";
import { InMemoryConversationStore } from "./conversation.store";

function makeService() {
  return new ConversationService(new InMemoryConversationStore(50));
}

const preview: AuditPreview = {
  appId: "1",
  country: "us",
  url: "https://apps.apple.com/us/app/id1",
  title: "DigitPay",
  developer: "Acme",
  category: "Finance",
  iconUrl: "https://example.com/icon.png",
};

const report = {
  appId: "1",
  app: { ...preview, rating: 5, ratingCount: 8 },
  overallScore: 72,
  dimensions: [],
  screenshots: [],
  screenshotAnalysis: null,
  competitorComparison: [],
  quickWins: [],
  highImpact: [],
  strategic: [],
  warnings: [],
  generatedAt: new Date().toISOString(),
} as unknown as AuditReport;

describe("ConversationService", () => {
  it("walks the lifecycle create → attachPreview → complete", () => {
    const svc = makeService();
    svc.create({ id: "c1", sessionId: "s1", url: preview.url });
    expect(svc.get("c1", "s1")?.status).toBe("running");

    svc.attachPreview("c1", preview);
    expect(svc.get("c1", "s1")?.title).toBe("DigitPay");

    svc.complete("c1", report);
    const done = svc.get("c1", "s1");
    expect(done?.status).toBe("completed");
    expect(done?.report?.overallScore).toBe(72);
  });

  it("records failures", () => {
    const svc = makeService();
    svc.create({ id: "c1", sessionId: "s1", url: preview.url });
    svc.fail("c1", "boom");
    expect(svc.get("c1", "s1")?.status).toBe("failed");
    expect(svc.get("c1", "s1")?.error).toBe("boom");
  });

  it("scopes get/list/remove to the owning session", () => {
    const svc = makeService();
    svc.create({ id: "c1", sessionId: "s1", url: preview.url });

    expect(svc.get("c1", "s2")).toBeUndefined();
    expect(svc.list("s2")).toHaveLength(0);
    expect(svc.remove("c1", "s2")).toBe(false);
    expect(svc.remove("c1", "s1")).toBe(true);
    expect(svc.list("s1")).toHaveLength(0);
  });

  it("returns summaries with an icon derived from preview/report", () => {
    const svc = makeService();
    svc.create({ id: "c1", sessionId: "s1", url: preview.url });
    svc.attachPreview("c1", preview);
    const [summary] = svc.list("s1");
    expect(summary).toMatchObject({ id: "c1", title: "DigitPay", iconUrl: preview.iconUrl });
  });
});
