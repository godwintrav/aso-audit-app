"use client";

import type { AuditPreview } from "@aso/schemas";
import { Card, CardContent } from "./ui/primitives";

export function ConfirmationCard({
  preview,
  onConfirm,
  onCancel,
}: {
  preview: AuditPreview;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Card>
      <CardContent>
        <p className="mb-4 text-sm font-medium text-slate-400">
          Is this the app you meant?
        </p>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.iconUrl}
            alt={preview.title}
            className="h-16 w-16 rounded-2xl border border-slate-800"
          />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold">{preview.title}</h2>
            <p className="truncate text-sm text-slate-400">{preview.developer}</p>
            <p className="mt-1 text-xs text-slate-500">{preview.category}</p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onConfirm}
            className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            Yes, run the audit
          </button>
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Try another link
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
