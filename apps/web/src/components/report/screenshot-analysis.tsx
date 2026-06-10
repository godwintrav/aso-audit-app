import type { ScreenshotAnalysis } from "@aso/schemas";
import { cn, scoreColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/primitives";

export function ScreenshotAnalysisSection({
  screenshots,
  analysis,
}: {
  screenshots: string[];
  analysis: ScreenshotAnalysis | null;
}) {
  if (screenshots.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Screenshot analysis
          {analysis ? (
            <span className={cn("ml-2 text-base", scoreColor(analysis.score))}>
              {analysis.score}/100
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {screenshots.slice(0, 10).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`Screenshot ${i + 1}`}
              className="h-72 rounded-xl border border-slate-800"
            />
          ))}
        </div>
        {analysis ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Findings title="Strengths" items={analysis.strengths} tone="text-emerald-300" />
            <Findings title="Weaknesses" items={analysis.weaknesses} tone="text-rose-300" />
            <Findings title="Recommendations" items={analysis.recommendations} tone="text-indigo-300" />
          </div>
        ) : (
          <p className="text-sm text-slate-500">Screenshot analysis was unavailable.</p>
        )}
      </CardContent>
    </Card>
  );
}

function Findings({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div>
      <h4 className={cn("mb-2 text-xs font-semibold uppercase", tone)}>{title}</h4>
      <ul className="space-y-1 text-sm text-slate-400">
        {items.length === 0 ? (
          <li className="text-slate-600">None</li>
        ) : (
          items.map((item, i) => <li key={i}>• {item}</li>)
        )}
      </ul>
    </div>
  );
}
