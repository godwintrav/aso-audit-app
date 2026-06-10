"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DimensionScoreSchema = exports.DimensionKeySchema = void 0;
const zod_1 = require("zod");
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
    weight: zod_1.z.number().min(0).max(100),
    score: zod_1.z.number().min(0).max(100),
    weightedScore: zod_1.z.number().min(0).max(100),
    summary: zod_1.z.string(),
});
