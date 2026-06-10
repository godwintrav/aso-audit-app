import type { DimensionScore } from "@aso/schemas";

export function computeOverallScore(dimensions: readonly DimensionScore[]): number {
  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = dimensions.reduce((sum, d) => sum + d.score * d.weight, 0);
  return Math.round(weightedSum / totalWeight);
}

export function weightedScore(score: number, weight: number): number {
  return Math.round((score * weight) / 100);
}

export function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
