import type { AuditReport } from "@aso/schemas";
import { CompetitorTable } from "./competitor-table";
import { DimensionScores } from "./dimension-scores";
import { OverallScoreCard } from "./overall-score";
import { RecommendationSection } from "./recommendations";
import { ScreenshotAnalysisSection } from "./screenshot-analysis";

export function ReportView({ report }: { report: AuditReport }) {
  return (
    <div className="space-y-6">
      <OverallScoreCard score={report.overallScore} app={report.app} />

      {report.warnings.length > 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          {report.warnings.map((w, i) => (
            <p key={i}>⚠ {w}</p>
          ))}
        </div>
      ) : null}

      <DimensionScores dimensions={report.dimensions} />

      <RecommendationSection
        title="Quick wins"
        description="Low effort, high impact — ship these first."
        items={report.quickWins}
      />
      <RecommendationSection
        title="High-impact changes"
        description="Higher effort, potentially significant gains."
        items={report.highImpact}
      />
      <RecommendationSection
        title="Strategic recommendations"
        description="Long-term growth: localization, keyword expansion, in-app events."
        items={report.strategic}
      />

      <ScreenshotAnalysisSection
        screenshots={report.screenshots}
        analysis={report.screenshotAnalysis}
      />

      <CompetitorTable rows={report.competitorComparison} />
    </div>
  );
}
