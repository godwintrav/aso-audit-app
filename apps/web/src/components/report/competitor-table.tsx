import type { CompetitorComparisonRow } from "@aso/schemas";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "../ui/primitives";

function qualityTone(q: string) {
  return q === "stronger" ? "good" : q === "weaker" ? "bad" : "neutral";
}

export function CompetitorTable({ rows }: { rows: CompetitorComparisonRow[] }) {
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Competitor comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-4">App</th>
                <th className="py-2 pr-4">Rating</th>
                <th className="py-2 pr-4">Metadata</th>
                <th className="py-2 pr-4">Screenshots</th>
                <th className="py-2">Positioning</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.competitor.appId} className="border-t border-slate-800">
                  <td className="py-3 pr-4 font-medium text-slate-200">
                    {row.competitor.title}
                  </td>
                  <td className="py-3 pr-4 text-slate-400">
                    {row.competitor.rating ? `${row.competitor.rating}★` : "N/A"}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={qualityTone(row.metadataQuality)}>{row.metadataQuality}</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={qualityTone(row.screenshotQuality)}>
                      {row.screenshotQuality}
                    </Badge>
                  </td>
                  <td className="py-3 text-slate-400">{row.positioning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Quality badges compare each competitor against the audited app.
        </p>
      </CardContent>
    </Card>
  );
}
