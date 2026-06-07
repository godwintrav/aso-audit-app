import { createStubGateway } from "@aso/agents";
import { type AppListing, AuditReportSchema } from "@aso/schemas";
import { describe, expect, it } from "vitest";
import { runAudit } from "./run";

function fullListing(): AppListing {
  return {
    appId: "6747904851",
    country: "ng",
    url: "https://apps.apple.com/ng/app/id6747904851",
    title: "DigitPay",
    subtitle: "Crypto payments to fiat",
    description: "Digitpay helps you pay, save, earn and spend, all in one app.",
    developer: "Digitpay Finance",
    category: "Finance",
    iconUrl: "https://example.com/icon.png",
    rating: 5,
    ratingCount: 8,
    hasAppPreviewVideo: false,
    screenshots: ["https://example.com/1.png", "https://example.com/2.png"],
    reviews: [{ title: "Great App", body: "Fast and reliable." }],
    competitors: [{ appId: "6708225786", title: "Blockroll", rating: 4.2, ratingCount: 50 }],
    warnings: [],
  };
}

describe("runAudit (integration, stubbed LLM)", () => {
  it("runs the full Mastra workflow and produces a valid report", async () => {
    const events: string[] = [];
    const report = await runAudit({
      listing: fullListing(),
      gateway: createStubGateway(),
      emit: (stage, status) => events.push(`${stage}:${status}`),
    });

    expect(() => AuditReportSchema.parse(report)).not.toThrow();
    expect(report.dimensions).toHaveLength(10);
    expect(report.quickWins.length).toBeGreaterThan(0);
    expect(report.screenshotAnalysis).not.toBeNull();
    expect(events).toContain("assemble_report:completed");
  });

  it("degrades gracefully when an analysis fails", async () => {
    const report = await runAudit({
      listing: fullListing(),
      gateway: createStubGateway({ failOn: ["screenshots", "reviews"] }),
    });

    expect(() => AuditReportSchema.parse(report)).not.toThrow();
    expect(report.screenshotAnalysis).toBeNull();
    // The report still scores all dimensions despite the failures.
    expect(report.dimensions).toHaveLength(10);
  });
});
