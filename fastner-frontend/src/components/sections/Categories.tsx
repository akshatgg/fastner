"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import { usePublicCategoryTree } from "@/features/catalog/queries";

export default function Categories() {
  const { data: tree, isLoading } = usePublicCategoryTree();

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

        {isLoading ? (
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] animate-pulse rounded-xl border border-ink-100 bg-white"
              />
            ))}
          </div>
        ) : tiles.length === 0 ? (
          <p className="mt-14 text-center text-sm text-ink-400">
            No categories available yet.
          </p>
        ) : (
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
        )}
      </div>
    </section>
  );
}
