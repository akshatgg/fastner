"use client";

import type { RatingSummary as Summary } from "../types";
import { Stars } from "./Stars";

/** Amazon-style "Customer reviews" rail: heading, average + stars inline,
 *  N global ratings, and a per-star bar chart with percentages. Star rows are
 *  clickable to filter the list. */
export default function RatingSummary({
  summary,
  loading,
  activeStar,
  onStarFilter,
}: {
  summary?: Summary;
  loading?: boolean;
  activeStar?: number | null;
  onStarFilter?: (star: number | null) => void;
}) {
  const count = summary?.count ?? 0;
  const average = summary?.average ?? 0;
  const pct = summary?.distribution_pct ?? {};
  const dist = summary?.distribution ?? {};

  return (
    <div>
      <h2 className="font-display text-xl font-bold uppercase tracking-wide text-ink-900">
        Customer reviews
      </h2>

      {loading ? (
        <p className="mt-4 text-sm text-ink-400">Loading…</p>
      ) : (
        <>
          {/* Average + stars, inline like Amazon */}
          <div className="mt-3 flex items-center gap-2">
            <Stars value={average} size="md" />
            <span className="text-sm font-medium text-ink-700">
              {average.toFixed(1)} out of 5
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {count.toLocaleString("en-IN")} global rating{count === 1 ? "" : "s"}
          </p>

          {/* Per-star bar chart */}
          <div className="mt-4 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const percent = pct[String(star)] ?? 0;
              const n = dist[String(star)] ?? 0;
              const active = activeStar === star;
              const clickable = Boolean(onStarFilter) && n > 0;

              const row = (
                <>
                  <span className="w-12 shrink-0 text-left text-sm text-ink-600 group-hover:text-brand-600">
                    {star} star
                  </span>
                  <span className="h-5 flex-1 overflow-hidden rounded-sm border border-ink-200 bg-ink-50">
                    <span
                      className="block h-full bg-amber-400 transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right text-sm text-ink-600">
                    {Math.round(percent)}%
                  </span>
                </>
              );

              return clickable ? (
                <button
                  key={star}
                  type="button"
                  onClick={() => onStarFilter?.(active ? null : star)}
                  aria-pressed={active}
                  className={`group flex w-full items-center gap-3 rounded-sm px-1 py-0.5 text-left transition hover:bg-ink-50 ${
                    active ? "ring-1 ring-brand-300" : ""
                  }`}
                >
                  {row}
                </button>
              ) : (
                <div key={star} className="group flex items-center gap-3 px-1 py-0.5">
                  {row}
                </div>
              );
            })}
          </div>

          {activeStar != null && onStarFilter && (
            <button
              type="button"
              onClick={() => onStarFilter(null)}
              className="mt-3 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Clear {activeStar}-star filter
            </button>
          )}
        </>
      )}
    </div>
  );
}
