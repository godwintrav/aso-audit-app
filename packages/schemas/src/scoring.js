"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DimensionScoreSchema = exports.DimensionKeySchema = void 0;
const zod_1 = require("zod");
/**
 * The ten ASO scoring dimensions. Kept here (next to the schema that uses
 * them) so the schema package stays self-contained; weights live in @aso/core.
 */
exports.DimensionKeySchema = zod_1.z.enum([
    "title",
    "subtitle",
    "keywordField",
    "description",
    "screenshots",
    "appPreviewVideo",
    "ratingsAndReviews",
    "icon",
    "conversionSignals",
    "competitivePosition",
]);
exports.DimensionScoreSchema = zod_1.z.object({
    dimension: exports.DimensionKeySchema,
    label: zod_1.z.string(),
    /** Weight as a percentage of the overall score (0–100). */
    weight: zod_1.z.number().min(0).max(100),
    /** Raw quality score for this dimension (0–100). */
    score: zod_1.z.number().min(0).max(100),
    /** score * (weight / 100), pre-normalization. */
    weightedScore: zod_1.z.number().min(0).max(100),
    summary: zod_1.z.string(),
});
//# sourceMappingURL=scoring.js.map