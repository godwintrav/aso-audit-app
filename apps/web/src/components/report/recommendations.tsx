import type { Recommendation } from "@aso/schemas";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "../ui/primitives";

function effortTone(level: string) {
  return level === "low" ? "good" : level === "medium" ? "warn" : "bad";
}
function impactTone(level: string) {
  return level === "high" ? "good" : level === "medium" ? "warn" : "neutral";
}

export function RecommendationSection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Recommendation[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No recommendations in this category.</p>
        ) : (
          items.map((rec, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-medium text-slate-100">{rec.title}</h4>
                <Badge tone={impactTone(rec.impact)}>impact: {rec.impact}</Badge>
                <Badge tone={effortTone(rec.effort)}>effort: {rec.effort}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                <span className="text-slate-500">Why: </span>
                {rec.reason}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                <span className="text-slate-500">Evidence: </span>
                {rec.evidence}
              </p>
              {rec.before || rec.after ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-rose-500/10 p-3 text-sm">
                    <div className="mb-1 text-xs font-medium text-rose-300">Before</div>
                    <div className="text-slate-300">{rec.before}</div>
                  </div>
                  <div className="rounded-lg bg-emerald-500/10 p-3 text-sm">
                    <div className="mb-1 text-xs font-medium text-emerald-300">After</div>
                    <div className="text-slate-300">{rec.after}</div>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
