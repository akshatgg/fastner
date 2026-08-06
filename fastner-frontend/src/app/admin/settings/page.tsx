"use client";

import { useEffect, useState } from "react";
import { BarChart3, Percent, RotateCcw } from "lucide-react";

import type { AdminHomepageStat } from "@/features/settings/api";
import {
  useAdminHomepageStats,
  useGstSetting,
  useUpdateGst,
  useUpdateHomepageStats,
} from "@/features/settings/queries";

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-ink-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Store-wide settings applied across the storefront.
        </p>
      </div>

      <GstCard />
      <HomepageStatsCard />
    </div>
  );
}

/** GST rate — applied to the product subtotal on every order. */
function GstCard() {
  const { data, isLoading } = useGstSetting();
  const update = useUpdateGst();
  const [rate, setRate] = useState("");

  // Seed the input from the saved value once it loads.
  useEffect(() => {
    if (data) setRate(String(data.gst_rate));
  }, [data]);

  const parsed = parseFloat(rate);
  const valid = !Number.isNaN(parsed) && parsed >= 0 && parsed <= 100;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valid) update.mutate(parsed);
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8"
    >
      <div className="flex items-center gap-2">
        <Percent className="h-5 w-5 text-brand-500" />
        <h2 className="font-display text-lg font-bold uppercase text-ink-900">
          GST rate
        </h2>
      </div>
      <p className="mt-2 text-sm text-ink-500">
        Applied to the product subtotal on every order (cart, checkout and the
        amount charged). Existing orders keep the rate they were placed with.
      </p>

      <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
        Rate (%)
      </label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          disabled={isLoading}
          className="w-40 rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <span className="text-sm font-semibold text-ink-500">%</span>
      </div>
      {!valid && rate !== "" && (
        <p className="mt-2 text-xs text-danger-600">
          Enter a rate between 0 and 100.
        </p>
      )}

      <div className="mt-6">
        <button
          type="submit"
          disabled={!valid || update.isPending || isLoading}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {update.isPending ? "Saving…" : "Save GST rate"}
        </button>
      </div>
    </form>
  );
}

/** One editable stat row. `value` is a string so the field can be empty
 *  (empty = show the live count); a number = fixed marketing override. */
type StatRow = {
  key: string;
  label: string;
  value: string;
  suffix: string;
  is_active: boolean;
  live_value: number;
};

const toRow = (s: AdminHomepageStat): StatRow => ({
  key: s.key,
  label: s.label,
  value: s.manual_value === null ? "" : String(s.manual_value),
  suffix: s.suffix,
  is_active: s.is_active,
  live_value: s.live_value,
});

/** Homepage "By the numbers" bar — edit labels, override figures, or reset each
 *  stat back to its live database count. */
function HomepageStatsCard() {
  const { data, isLoading } = useAdminHomepageStats();
  const update = useUpdateHomepageStats();
  const [rows, setRows] = useState<StatRow[]>([]);

  // Seed the editable rows once the config loads.
  useEffect(() => {
    if (data) setRows(data.map(toRow));
  }, [data]);

  const patch = (key: string, changes: Partial<StatRow>) =>
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...changes } : r)),
    );

  // Every override must be blank (live) or a non-negative number, and every
  // label must be present.
  const valid = rows.every(
    (r) =>
      r.label.trim() !== "" &&
      (r.value.trim() === "" ||
        (Number.isFinite(Number(r.value)) && Number(r.value) >= 0)),
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    update.mutate(
      rows.map((r) => ({
        key: r.key,
        label: r.label.trim(),
        manual_value:
          r.value.trim() === "" ? null : Math.round(Number(r.value)),
        suffix: r.suffix,
        is_active: r.is_active,
      })),
    );
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8"
    >
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-brand-500" />
        <h2 className="font-display text-lg font-bold uppercase text-ink-900">
          Homepage stats
        </h2>
      </div>
      <p className="mt-2 text-sm text-ink-500">
        The &ldquo;By the numbers&rdquo; bar on the homepage. Leave a figure
        blank to show the <strong>live count</strong> from the database (grows on
        its own); type a number to pin a fixed figure instead.
      </p>

      <div className="mt-6 space-y-5">
        {isLoading && (
          <p className="text-sm text-ink-500">Loading stats…</p>
        )}

        {rows.map((row) => {
          const isLive = row.value.trim() === "";
          return (
            <div
              key={row.key}
              className="rounded-xl border border-ink-100 bg-ink-50/60 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <input
                  value={row.label}
                  onChange={(e) => patch(row.key, { label: e.target.value })}
                  placeholder="Label"
                  className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                {/* Show / hide this stat in the bar. */}
                <label className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  <input
                    type="checkbox"
                    checked={row.is_active}
                    onChange={(e) =>
                      patch(row.key, { is_active: e.target.checked })
                    }
                    className="h-4 w-4 accent-brand-500"
                  />
                  Shown
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={row.value}
                  onChange={(e) => patch(row.key, { value: e.target.value })}
                  placeholder={`Live: ${row.live_value.toLocaleString()}`}
                  className="w-40 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <input
                  value={row.suffix}
                  onChange={(e) => patch(row.key, { suffix: e.target.value })}
                  maxLength={8}
                  aria-label="Suffix"
                  className="w-14 rounded-lg border border-ink-200 bg-white px-3 py-2 text-center text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                {isLive ? (
                  <span className="text-xs font-medium text-brand-600">
                    Live · {row.live_value.toLocaleString()}
                    {row.suffix}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => patch(row.key, { value: "" })}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 transition hover:text-brand-600"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset to live
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={!valid || update.isPending || isLoading}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {update.isPending ? "Saving…" : "Save homepage stats"}
        </button>
      </div>
    </form>
  );
}
