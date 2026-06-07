import type { DimensionKey } from "@aso/schemas";

export interface DimensionDefinition {
  key: DimensionKey;
  label: string;
  /** Weight exactly as specified in the assignment brief. */
  weight: number;
  description: string;
}


export const DIMENSION_DEFINITIONS: readonly DimensionDefinition[] = [
  {
    key: "title",
    label: "Title",
    weight: 20,
    description: "Keyword usage, character utilization, brand/keyword balance.",
  },
  {
    key: "subtitle",
    label: "Subtitle",
    weight: 15,
    description: "Keyword coverage, benefit framing, no duplication of title.",
  },
  {
    key: "keywordField",
    label: "Keyword Field",
    weight: 15,
    description: "Inferred keyword targeting (the field itself is never public).",
  },
  {
    key: "description",
    label: "Description",
    weight: 10,
    description: "Opening hook, keyword integration, feature framing, CTA.",
  },
  {
    key: "screenshots",
    label: "Screenshots",
    weight: 15,
    description: "Value proposition clarity, ordering, hierarchy, conversion.",
  },
  {
    key: "appPreviewVideo",
    label: "App Preview Video",
    weight: 5,
    description: "Presence and use of an app preview video.",
  },
  {
    key: "ratingsAndReviews",
    label: "Ratings & Reviews",
    weight: 15,
    description: "Rating value, review volume, sentiment and trust.",
  },
  {
    key: "icon",
    label: "Icon",
    weight: 5,
    description: "Icon presence, clarity and category fit.",
  },
  {
    key: "conversionSignals",
    label: "Conversion Signals",
    weight: 5,
    description: "Overall store-listing conversion readiness.",
  },
  {
    key: "competitivePosition",
    label: "Competitive Position",
    weight: 5,
    description: "Standing relative to comparable apps.",
  },
] as const;

export const DIMENSION_BY_KEY: Record<DimensionKey, DimensionDefinition> =
  Object.fromEntries(
    DIMENSION_DEFINITIONS.map((d) => [d.key, d]),
  ) as Record<DimensionKey, DimensionDefinition>;

/** Sum of the raw weights as written in the brief (110). */
export const TOTAL_RAW_WEIGHT = DIMENSION_DEFINITIONS.reduce(
  (sum, d) => sum + d.weight,
  0,
);
