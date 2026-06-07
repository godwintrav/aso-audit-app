import type { DimensionScore } from "@aso/schemas";
import { describe, expect, it } from "vitest";
import { DIMENSION_DEFINITIONS, TOTAL_RAW_WEIGHT } from "../constants/scoring";
import { clampScore, computeOverallScore, weightedScore } from "./compute";

function dim(score: number, weight: number): DimensionScore {
  return {
    dimension: "title",
    label: "Title",
    weight,
    score,
    weightedScore: weightedScore(score, weight),
    summary: "",
  };
}

describe("computeOverallScore", () => {
  it("returns 0 for no dimensions", () => {
    expect(computeOverallScore([])).toBe(0);
  });

  it("normalizes by total weight (handles the brief's 110 total)", () => {
    // All dimensions scoring 80 → overall 80 regardless of weight total.
    const dims = DIMENSION_DEFINITIONS.map((d) => dim(80, d.weight));
    expect(computeOverallScore(dims)).toBe(80);
  });

  it("weights higher-weight dimensions more heavily", () => {
    const dims = [dim(100, 20), dim(0, 5)];
    // (100*20 + 0*5) / 25 = 80
    expect(computeOverallScore(dims)).toBe(80);
  });

  it("confirms the brief's weights sum to 110", () => {
    expect(TOTAL_RAW_WEIGHT).toBe(110);
  });
});

describe("clampScore", () => {
  it("clamps and rounds into 0-100", () => {
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(150)).toBe(100);
    expect(clampScore(72.4)).toBe(72);
    expect(clampScore(Number.NaN)).toBe(0);
  });
});
