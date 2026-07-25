"use client";

import { useState } from "react";

import SectionHeading from "@/components/ui/SectionHeading";
import { usePublicCategoryTree } from "@/features/catalog/queries";

// The catalog is split into two ranges (mirrors the client's master sheet
// tabs). Only "Industrial Supply" has data today; "DIY & Home" is shown but
// disabled until its catalog is populated — flip `DIY_ENABLED` to turn it on.
type Segment = "industrial" | "diy";
const DIY_ENABLED = false;

export default function Categories() {
  const { data: tree, isLoading } = usePublicCategoryTree();
  const [segment, setSegment] = useState<Segment>("industrial");

  // Live top-level categories, managed from the admin dashboard.
  const tiles = tree ?? [];

  return (
    <section id="categories" className="bg-ink-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Range"
          title="Shop by Category"
          description="Find exactly what your project needs — across every grade, size and finish."
        />

        {/* Range selector — Industrial Supply | DIY & Home (coming soon) */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex flex-wrap justify-center gap-1 rounded-full border border-ink-200 bg-white p-1 shadow-card">
            <button
              type="button"
              onClick={() => setSegment("industrial")}
              aria-pressed={segment === "industrial"}
              className={`rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition ${
                segment === "industrial"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              Industrial Supply
            </button>
            <button
              type="button"
              disabled={!DIY_ENABLED}
              onClick={() => DIY_ENABLED && setSegment("diy")}
              aria-pressed={segment === "diy"}
              title={DIY_ENABLED ? undefined : "Coming soon"}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition ${
                segment === "diy"
                  ? "bg-brand-500 text-white shadow-sm"
                  : DIY_ENABLED
                    ? "text-ink-600 hover:text-ink-900"
                    : "cursor-not-allowed text-ink-300"
              }`}
            >
              DIY &amp; Home
              {!DIY_ENABLED && (
                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-ink-400">
                  Soon
                </span>
              )}
            </button>
          </div>
        </div>

        {segment === "industrial" ? (
          isLoading ? (
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/5] animate-pulse rounded-xl border border-ink-100 bg-white"
                />
              ))}
            </div>
          ) : tiles.length === 0 ? (
            <p className="mt-10 text-center text-sm text-ink-400">
              No categories available yet.
            </p>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {tiles.map((cat) => (
                <a
                  key={cat.id}
                  href={`/category/${cat.id}`}
                  className="group flex flex-col items-center rounded-xl border border-ink-100 bg-white p-4 text-center shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
                >
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-ink-50">
                    {cat.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                        draggable={false}
                        loading="lazy"
                      />
                    ) : (
                      <span className="font-display text-4xl font-bold text-ink-200">
                        {cat.name.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-sm font-bold uppercase tracking-wide text-ink-900 sm:text-base">
                    {cat.name}
                  </h3>
                </a>
              ))}
            </div>
          )
        ) : (
          // Placeholder for when the DIY & Home range is enabled in future.
          <p className="mt-10 text-center text-sm text-ink-400">
            The DIY &amp; Home range is coming soon.
          </p>
        )}
      </div>
    </section>
  );
}
