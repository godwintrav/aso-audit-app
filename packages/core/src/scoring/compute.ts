import type { DimensionScore } from "@aso/schemas";

/**
 * Computes the overall ASO score (0–100) as a weighted average of the
 * dimension scores, normalized by the sum of the weights actually present.
 *
 * Normalizing by the real total (rather than assuming weights sum to 100)
 * keeps the result on a 0–100 scale even though the brief's weights sum to
 * 110, and stays correct if a future dimension is added or removed.
 */
export function computeOverallScore(dimensions: readonly DimensionScore[]): number {
  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = dimensions.reduce((sum, d) => sum + d.score * d.weight, 0);
  return Math.round(weightedSum / totalWeight);
}

/** Computes the `weightedScore` field for a single dimension (pre-normalization). */
export function weightedScore(score: number, weight: number): number {
  return Math.round((score * weight) / 100);
}

/** Clamps an arbitrary number into the valid 0–100 score range. */
export function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
