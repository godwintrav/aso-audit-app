import type { DimensionScore } from "@aso/schemas";
import { cn, scoreColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, ProgressBar } from "../ui/primitives";

export function DimensionScores({ dimensions }: { dimensions: DimensionScore[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dimension scores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dimensions.map((d) => (
          <div key={d.dimension}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium text-slate-200">{d.label}</span>
              <span className="text-xs text-slate-500">
                weight {d.weight}% ·{" "}
                <span className={cn("font-semibold", scoreColor(d.score))}>{d.score}</span>/100
              </span>
            </div>
            <ProgressBar value={d.score} />
            <p className="mt-1 text-xs text-slate-500">{d.summary}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
