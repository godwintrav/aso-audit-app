"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationSetSchema = exports.RecommendationSchema = exports.ImpactLevelSchema = exports.EffortLevelSchema = exports.RecommendationCategorySchema = void 0;
const zod_1 = require("zod");
exports.RecommendationCategorySchema = zod_1.z.enum([
    "quick_win",
    "high_impact",
    "strategic",
]);
exports.EffortLevelSchema = zod_1.z.enum(["low", "medium", "high"]);
exports.ImpactLevelSchema = zod_1.z.enum(["low", "medium", "high"]);
/**
 * Every recommendation is evidence-driven and actionable. For text-based
 * suggestions the model must supply concrete `before`/`after` copy.
 */
exports.RecommendationSchema = zod_1.z.object({
    category: exports.RecommendationCategorySchema,
    title: zod_1.z.string(),
    evidence: zod_1.z.string(),
    reason: zod_1.z.string(),
    impact: exports.ImpactLevelSchema,
    effort: exports.EffortLevelSchema,
    before: zod_1.z.string().optional(),
    after: zod_1.z.string().optional(),
});
/** The full set of recommendations produced by the recommendation tool. */
exports.RecommendationSetSchema = zod_1.z.object({
    quickWins: zod_1.z.array(exports.RecommendationSchema),
    highImpact: zod_1.z.array(exports.RecommendationSchema),
    strategic: zod_1.z.array(exports.RecommendationSchema),
});
//# sourceMappingURL=recommendation.js.map