"use client";

import { isAppStoreUrl } from "@aso/core";
import { type FormEvent, useState } from "react";

const INVALID_MESSAGE =
  "Enter a valid Apple App Store app link, e.g. apps.apple.com/us/app/name/id123456789";

export function UrlInput({
  onSubmit,
  loading,
}: {
  onSubmit: (url: string) => void;
  loading: boolean;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    // Validate with the SAME rule the backend uses (@aso/core) before calling the API.
    if (!isAppStoreUrl(trimmed)) {
      setError(INVALID_MESSAGE);
      return;
    }
    setError(null);
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          placeholder="https://apps.apple.com/us/app/your-app/id123456789"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "url-error" : "url-hint"}
          className={`flex-1 rounded-xl border bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:ring-2 ${
            error
              ? "border-rose-500/60 ring-rose-500/40"
              : "border-slate-700 ring-indigo-500/40"
          }`}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Fetching…" : "Audit app"}
        </button>
      </div>
      {error ? (
        <p id="url-error" className="mt-2 text-xs text-rose-400">
          {error}
        </p>
      ) : (
        <p id="url-hint" className="mt-2 text-xs text-slate-500">
          Paste any Apple App Store app link to generate a full ASO audit.
        </p>
      )}
    </form>
  );
}
