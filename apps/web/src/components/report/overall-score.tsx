import type { AppSummary } from "@aso/schemas";
import { cn, scoreColor } from "@/lib/utils";
import { Card, CardContent } from "../ui/primitives";

export function OverallScoreCard({
  score,
  app,
}: {
  score: number;
  app: AppSummary;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={app.iconUrl}
            alt={app.title}
            className="h-20 w-20 rounded-2xl border border-slate-800"
          />
          <div>
            <h2 className="text-2xl font-semibold">{app.title}</h2>
            {app.subtitle ? (
              <p className="text-sm text-slate-400">{app.subtitle}</p>
            ) : null}
            <p className="mt-1 text-xs text-slate-500">
              {app.developer} · {app.category} · {app.rating}★ ({app.ratingCount.toLocaleString()})
            </p>
          </div>
        </div>
        <div className="text-center">
          <div className={cn("text-6xl font-bold tabular-nums", scoreColor(score))}>
            {score}
          </div>
          <div className="text-sm text-slate-500">out of 100</div>
        </div>
      </CardContent>
    </Card>
  );
}
