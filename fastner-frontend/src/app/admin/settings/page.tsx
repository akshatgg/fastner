"use client";

import { useEffect, useState } from "react";
import { Percent } from "lucide-react";

import { useGstSetting, useUpdateGst } from "@/features/settings/queries";

export default function AdminSettingsPage() {
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
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-ink-900">
        Settings
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Store-wide settings applied across the storefront.
      </p>

      <form
        onSubmit={submit}
        className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8"
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
    </div>
  );
}
