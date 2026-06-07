/** Apple App Store metadata length limits, used by the analysis prompts/heuristics. */
export const METADATA_LIMITS = {
  /** Maximum characters for the app title. */
  TITLE_MAX: 30,
  /** Maximum characters for the subtitle. */
  SUBTITLE_MAX: 30,
  /** Maximum characters for the keyword field. */
  KEYWORD_FIELD_MAX: 100,
} as const;

/** How many competitor candidates to enrich and analyze. */
export const MAX_COMPETITORS = 4;

/** How many reviews to feed the review-analysis tool. */
export const MAX_REVIEWS_FOR_ANALYSIS = 20;

/** How many screenshots to send to the vision model. */
export const MAX_SCREENSHOTS_FOR_ANALYSIS = 8;
