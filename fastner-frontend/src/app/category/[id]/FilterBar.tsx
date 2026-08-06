"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import type { Facet } from "@/features/catalog/types";

/** Rows shown before a column starts scrolling. Keeps every column the same
 *  height regardless of how many values its group has. */
const VISIBLE_ROWS = 7;

/** Column count at the widest breakpoint, capped so a group never gets too
 *  narrow to read. Anything past the cap wraps onto another row — which is how
 *  the bar grows as more spec groups are added to a category. */
const WIDE_COLS: Record<number, string> = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
};

/**
 * One spec group — title, a type-ahead over its own values, and the checkbox
 * list. The search box matters because a group like "Thread Size" can carry
 * dozens of values; scrolling for M12 is slower than typing it.
 */
function FacetColumn({
  facet,
  selected,
  onToggle,
}: {
  facet: Facet;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const values = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return facet.values;
    return facet.values.filter((v) => v.value.toLowerCase().includes(q));
  }, [facet.values, query]);

  const activeCount = facet.values.filter((v) => selected.includes(v.id)).length;

  return (
    <fieldset className="flex min-w-0 flex-col border border-ink-100 bg-white">
      <legend className="sr-only">{facet.group_name}</legend>

      <div className="flex items-center gap-2 px-4 pt-4">
        <span className="truncate font-display text-sm font-bold uppercase tracking-wide text-ink-900">
          {facet.group_name}
          {facet.unit && (
            <span className="ml-1 font-sans text-xs font-medium normal-case text-ink-400">
              ({facet.unit})
            </span>
          )}
        </span>
        {activeCount > 0 && (
          <span className="ml-auto shrink-0 bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </div>

      <div className="relative px-4 pt-3">
        <Search className="pointer-events-none absolute left-6.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-300" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          aria-label={`Search ${facet.group_name}`}
          className="w-full border border-ink-200 bg-white py-1.5 pl-7 pr-2 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500"
        />
      </div>

      {/* Fixed viewport, scrolls internally — every column stays the same
          height however many values its group has. */}
      <div
        className="mt-2 overflow-y-auto"
        style={{ maxHeight: `${VISIBLE_ROWS * 2.25}rem` }}
      >
        {values.length === 0 ? (
          <p className="px-4 py-3 text-xs text-ink-400">No matches.</p>
        ) : (
          values.map((v) => {
            const checked = selected.includes(v.id);
            return (
              <label
                key={v.id}
                className={`flex cursor-pointer items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-ink-50 ${
                  checked ? "text-ink-900" : "text-ink-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(v.id)}
                  className="h-3.5 w-3.5 shrink-0 accent-brand-500"
                />
                <span className="min-w-0 flex-1 truncate">{v.value}</span>
                <span className="shrink-0 font-mono text-[11px] text-ink-400">
                  ({v.count.toLocaleString()})
                </span>
              </label>
            );
          })
        )}
      </div>
    </fieldset>
  );
}

/**
 * Full-width faceted filter bar for a leaf category. Replaces the old left-hand
 * sidebar: the groups run across the top of the page as equal columns, so the
 * product grid gets the whole width beneath and every spec group is visible at
 * once rather than stacked in a narrow rail.
 */
export default function FilterBar({
  facets,
  selected,
  onToggle,
  onClear,
}: {
  facets: Facet[];
  selected: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  // Flat id → label lookup so the active chips can name a value without
  // re-scanning every group per chip.
  const labels = useMemo(() => {
    const m = new Map<string, { group: string; value: string }>();
    for (const f of facets)
      for (const v of f.values)
        m.set(v.id, { group: f.group_name, value: v.value });
    return m;
  }, [facets]);

  // Only chips for values still present in the current facet set — a filter
  // can drop out of the response once other filters narrow the results.
  const chips = selected.filter((id) => labels.has(id));

  if (facets.length === 0) return null;

  const wide = WIDE_COLS[Math.min(facets.length, 5)] ?? WIDE_COLS[5];

  return (
    <section aria-label="Filter products" className="mt-6">
      <div
        className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${wide}`}
      >
        {facets.map((facet) => (
          <FacetColumn
            key={facet.group_id}
            facet={facet}
            selected={selected}
            onToggle={onToggle}
          />
        ))}
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Filtering by
          </span>
          {chips.map((id) => {
            const l = labels.get(id)!;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onToggle(id)}
                className="inline-flex items-center gap-1.5 border border-brand-200 bg-brand-50 py-1 pl-2.5 pr-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
              >
                <span className="text-ink-400">{l.group}:</span>
                {l.value}
                <X className="h-3 w-3" />
                <span className="sr-only">Remove filter</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-brand-600 underline-offset-2 hover:text-brand-700 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </section>
  );
}
