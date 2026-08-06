"use client";

import type { ReactNode } from "react";

import { usePublicCategoryTree } from "@/features/catalog/queries";
import type { CategoryRange } from "@/features/catalog/types";

// The top-level category grid for a single storefront range. Used by the
// dedicated range pages (`/industrial-supply`, `/diy-home`); each tile links
// to that category's product listing at `/category/{id}`.
export default function RangeCatalog({
  range,
  emptyTitle = "No categories available yet.",
  emptyHint,
  emptyAction,
}: {
  range: CategoryRange;
  emptyTitle?: string;
  emptyHint?: string;
  emptyAction?: ReactNode;
}) {
  const { data: tree, isLoading } = usePublicCategoryTree(range);
  const tiles = tree ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/5] animate-pulse rounded-xl border border-ink-100 bg-white"
          />
        ))}
      </div>
    );
  }

  if (tiles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-16 text-center">
        <p className="font-semibold text-ink-800">{emptyTitle}</p>
        {emptyHint && (
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">{emptyHint}</p>
        )}
        {emptyAction && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">{emptyAction}</div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
  );
}
