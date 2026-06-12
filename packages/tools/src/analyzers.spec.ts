import type { AnalysisGateway, GenerateStructuredInput } from "@aso/agents";
import { MAX_REVIEWS_FOR_ANALYSIS, MAX_SCREENSHOTS_FOR_ANALYSIS } from "@aso/core";
import {
  CompetitorAnalysisSchema,
  DescriptionAnalysisSchema,
  RecommendationSetSchema,
  ReviewAnalysisSchema,
  ScreenshotAnalysisSchema,
  SubtitleAnalysisSchema,
  TitleAnalysisSchema,
} from "@aso/schemas";
import { describe, expect, it } from "vitest";
import {
  analyzeCompetitors,
  analyzeDescription,
  analyzeReviews,
  analyzeScreenshots,
  analyzeSubtitle,
  analyzeTitle,
  generateRecommendations,
} from "./analyzers";

function recordingGateway() {
  const calls: GenerateStructuredInput<unknown>[] = [];
  const gateway: AnalysisGateway = {
    async generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T> {
      calls.push(input as GenerateStructuredInput<unknown>);
      return { recorded: true } as unknown as T;
    },
  };
  return { gateway, calls };
}

describe("analyzeTitle", () => {
  it("delegates to the gateway with the title kind, schema and prompt", async () => {
    const { gateway, calls } = recordingGateway();
    const result = await analyzeTitle(gateway, { title: "DigitPay", category: "Finance" });
    expect(result).toEqual({ recorded: true });
    expect(calls).toHaveLength(1);
    expect(calls[0].kind).toBe("title");
    expect(calls[0].schema).toBe(TitleAnalysisSchema);
    expect(calls[0].prompt).toContain("DigitPay");
    expect(calls[0].system).toBeTruthy();
  });
});

describe("analyzeSubtitle", () => {
  it("uses the subtitle kind and schema", async () => {
    const { gateway, calls } = recordingGateway();
    await analyzeSubtitle(gateway, { title: "DigitPay", subtitle: "Crypto wallet" });
    expect(calls[0].kind).toBe("subtitle");
    expect(calls[0].schema).toBe(SubtitleAnalysisSchema);
  });
});

describe("analyzeDescription", () => {
  it("uses the description kind and schema", async () => {
    const { gateway, calls } = recordingGateway();
    await analyzeDescription(gateway, { description: "A great app" });
    expect(calls[0].kind).toBe("description");
    expect(calls[0].schema).toBe(DescriptionAnalysisSchema);
  });
});

describe("analyzeScreenshots", () => {
  it("passes the screenshots through as images when under the limit", async () => {
    const { gateway, calls } = recordingGateway();
    const screenshots = ["a.png", "b.png", "c.png"];
    await analyzeScreenshots(gateway, { screenshots });
    expect(calls[0].kind).toBe("screenshots");
    expect(calls[0].schema).toBe(ScreenshotAnalysisSchema);
    expect(calls[0].images).toEqual(screenshots);
    expect(calls[0].prompt).toContain("3 screenshots");
  });

  it("caps the number of analyzed screenshots at the configured maximum", async () => {
    const { gateway, calls } = recordingGateway();
    const screenshots = Array.from({ length: MAX_SCREENSHOTS_FOR_ANALYSIS + 5 }, (_, i) => `${i}.png`);
    await analyzeScreenshots(gateway, { screenshots });
    expect(calls[0].images).toHaveLength(MAX_SCREENSHOTS_FOR_ANALYSIS);
    expect(calls[0].prompt).toContain(`${MAX_SCREENSHOTS_FOR_ANALYSIS} screenshots`);
  });

  it("handles an empty screenshot list", async () => {
    const { gateway, calls } = recordingGateway();
    await analyzeScreenshots(gateway, { screenshots: [] });
    expect(calls[0].images).toEqual([]);
    expect(calls[0].prompt).toContain("0 screenshots");
  });
});

describe("analyzeReviews", () => {
  it("uses the reviews kind and includes rating context", async () => {
    const { gateway, calls } = recordingGateway();
    await analyzeReviews(gateway, {
      reviews: [{ body: "Good" }],
      rating: 4.5,
      ratingCount: 100,
    });
    expect(calls[0].kind).toBe("reviews");
    expect(calls[0].schema).toBe(ReviewAnalysisSchema);
    expect(calls[0].prompt).toContain("4.5");
    expect(calls[0].prompt).toContain("100");
  });

  it("caps the number of analyzed reviews at the configured maximum", async () => {
    const { gateway, calls } = recordingGateway();
    const reviews = Array.from({ length: MAX_REVIEWS_FOR_ANALYSIS + 10 }, (_, i) => ({
      body: `review-${i}`,
    }));
    await analyzeReviews(gateway, { reviews, rating: 4, ratingCount: 30 });
    expect(calls[0].prompt).toContain(`${MAX_REVIEWS_FOR_ANALYSIS}.`);
    expect(calls[0].prompt).not.toContain(`${MAX_REVIEWS_FOR_ANALYSIS + 1}.`);
  });
});

describe("analyzeCompetitors", () => {
  it("uses the competitors kind and schema", async () => {
    const { gateway, calls } = recordingGateway();
    await analyzeCompetitors(gateway, {
      app: { title: "DigitPay", subtitle: "Crypto", category: "Finance", rating: 4.5, ratingCount: 120 },
      competitors: [],
    });
    expect(calls[0].kind).toBe("competitors");
    expect(calls[0].schema).toBe(CompetitorAnalysisSchema);
  });
});

describe("generateRecommendations", () => {
  it("uses the recommendations kind and schema", async () => {
    const { gateway, calls } = recordingGateway();
    await generateRecommendations(gateway, {
      listing: {
        appId: "1",
        country: "us",
        url: "https://apps.apple.com/us/app/id1",
        title: "DigitPay",
        description: "desc",
        developer: "Dev",
        category: "Finance",
        iconUrl: "https://example.com/icon.png",
        rating: 4.5,
        ratingCount: 120,
        hasAppPreviewVideo: false,
        screenshots: [],
        reviews: [],
        competitors: [],
        warnings: [],
      },
      dimensions: [],
      analysisSummary: "summary",
    });
    expect(calls[0].kind).toBe("recommendations");
    expect(calls[0].schema).toBe(RecommendationSetSchema);
    expect(calls[0].prompt).toContain("summary");
  });
});
