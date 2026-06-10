"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppListingSchema = exports.CompetitorSchema = exports.ReviewSchema = void 0;
const zod_1 = require("zod");

exports.ReviewSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    body: zod_1.z.string(),
    rating: zod_1.z.number().min(0).max(5).optional(),
});

exports.CompetitorSchema = zod_1.z.object({
    appId: zod_1.z.string(),
    title: zod_1.z.string(),
    developer: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    rating: zod_1.z.number().min(0).max(5).optional(),
    ratingCount: zod_1.z.number().int().nonnegative().optional(),
    iconUrl: zod_1.z.string().url().optional(),
    screenshotCount: zod_1.z.number().int().nonnegative().optional(),
});

exports.AppListingSchema = zod_1.z.object({
    appId: zod_1.z.string(),
    country: zod_1.z.string(),
    url: zod_1.z.string().url(),
    title: zod_1.z.string(),
    subtitle: zod_1.z.string().optional(),
    description: zod_1.z.string(),
    developer: zod_1.z.string(),
    category: zod_1.z.string(),
    iconUrl: zod_1.z.string().url(),
    rating: zod_1.z.number().min(0).max(5),
    ratingCount: zod_1.z.number().int().nonnegative(),
    version: zod_1.z.string().optional(),
    whatsNew: zod_1.z.string().optional(),
    hasAppPreviewVideo: zod_1.z.boolean().default(false),
    screenshots: zod_1.z.array(zod_1.z.string().url()),
    reviews: zod_1.z.array(exports.ReviewSchema),
    competitors: zod_1.z.array(exports.CompetitorSchema),

    warnings: zod_1.z.array(zod_1.z.string()).default([]),
});
