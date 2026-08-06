"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";

import { usePublicIndustries } from "@/features/industries/queries";
import { HexNut } from "@/components/ui/FastenerArt";

type Tile = { key: string; name: string; image: string | null; blurb: string | null };

/** One sector card — photo on top, then name, blurb and a "Learn more" cue.
 *  When no photo is set the image area is a branded "sector plate" (ink gradient
 *  + a faint fastener glyph + the sector initial) so the card still reads as
 *  designed, not broken. Add a photo in /admin/industries for the full look. */
function IndustryCard({ tile }: { tile: Tile }) {
  return (
    <a
      href="#contact"
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {tile.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tile.image}
            alt={tile.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink-900 to-ink-950">
            <HexNut
              aria-hidden
              className="absolute -right-6 -top-6 h-40 w-40 rotate-12 text-white/[0.05]"
            />
            <span className="font-display text-6xl font-bold text-white/25">
              {tile.name.trim().charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Brand accent that widens on hover — the one moving part per card. */}
        <span className="absolute bottom-0 left-0 h-1 w-12 bg-brand-500 transition-all duration-300 group-hover:w-full" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-bold uppercase tracking-wide text-ink-900 sm:text-2xl">
          {tile.name}
        </h3>
        {tile.blurb && (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500 sm:text-base">
            {tile.blurb}
          </p>
        )}
        <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-brand-600">
          Learn more
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </a>
  );
}

/** Skeleton placeholder shown while the live industries load. */
function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-ink-100">
      <div className="aspect-[16/10] animate-pulse bg-ink-100" />
      <div className="space-y-3 p-6">
        <div className="h-5 w-2/3 animate-pulse rounded bg-ink-100" />
        <div className="h-4 w-full animate-pulse rounded bg-ink-100" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-ink-100" />
      </div>
    </div>
  );
}

export default function Industries() {
  const { data, isLoading } = usePublicIndustries();

  // Live, admin-managed sectors (see /admin/industries).
  const tiles = useMemo<Tile[]>(
    () =>
      (data ?? []).map((i) => ({
        key: i.id,
        name: i.name,
        image: i.image_url,
        blurb: i.blurb,
      })),
    [data],
  );

  return (
    <section id="industries" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:items-start lg:gap-16">
          {/* Left — heading block. Sticks alongside the cards on large screens. */}
          <div className="lg:sticky lg:top-28">
            <span className="mb-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
              <span className="h-px w-6 bg-brand-500" />
              Sectors We Supply
            </span>
            <h2 className="font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight text-ink-900 sm:text-5xl">
              Powering the Industries That Build Tomorrow
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-500">
              Trusted by the industries that demand precision.
            </p>
            <a
              href="#contact"
              className="group mt-8 inline-flex items-center gap-2 rounded-md bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-600"
            >
              Talk to our team
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* Right — sector cards. */}
          <div>
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : tiles.length === 0 ? (
              <div className="flex h-full min-h-56 items-center justify-center rounded-2xl border border-dashed border-ink-200 p-8 text-center">
                <p className="text-sm text-ink-400">
                  Sectors appear here once added in the admin dashboard.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {tiles.map((tile) => (
                  <IndustryCard key={tile.key} tile={tile} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
