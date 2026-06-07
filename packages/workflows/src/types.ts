import type {
  CompetitorAnalysis,
  DescriptionAnalysis,
  RecommendationSet,
  ReviewAnalysis,
  ScreenshotAnalysis,
  SubtitleAnalysis,
  TitleAnalysis,
} from "@aso/schemas";

export interface AnalysisResults {
  title: TitleAnalysis | null;
  subtitle: SubtitleAnalysis | null;
  description: DescriptionAnalysis | null;
  screenshots: ScreenshotAnalysis | null;
  reviews: ReviewAnalysis | null;
  competitors: CompetitorAnalysis | null;
}

export type { RecommendationSet };
