import type {
  CompetitorAnalysis,
  DescriptionAnalysis,
  RecommendationSet,
  ReviewAnalysis,
  ScreenshotAnalysis,
  SubtitleAnalysis,
  TitleAnalysis,
} from "@aso/schemas";

/**
 * The accumulating output of the analysis stage. Every field is nullable so a
 * single failed or data-starved analysis degrades gracefully without aborting
 * the audit.
 */
export interface AnalysisResults {
  title: TitleAnalysis | null;
  subtitle: SubtitleAnalysis | null;
  description: DescriptionAnalysis | null;
  screenshots: ScreenshotAnalysis | null;
  reviews: ReviewAnalysis | null;
  competitors: CompetitorAnalysis | null;
}

export type { RecommendationSet };
