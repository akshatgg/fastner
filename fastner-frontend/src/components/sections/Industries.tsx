"use client";

import { useMemo } from "react";
import { ArrowRight, Factory } from "lucide-react";

import { usePublicIndustries } from "@/features/industries/queries";
import Eyebrow from "@/components/ui/Eyebrow";

type Tile = { key: string; name: string; blurb: string | null };

/** Row transition — a long, soft settle shared by every animated part. */
const EASE = "duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)]";

/** One sector, as an index row: number, name, blurb, and an arrow plate that
 *  fills on hover. The sector photo is deliberately unused here — the index
 *  reads as a spec sheet, and a row of thumbnails would fight the numerals. */
function SectorRow({ tile, num }: { tile: Tile; num: string }) {
  return (
    <li className="border-b border-ink-950/15">
      <a
        href="#contact"
        className={`group grid grid-cols-[56px_minmax(0,1fr)_44px] items-center gap-4 py-6 pl-1 outline-none transition-[background,box-shadow] hover:bg-white/55 focus-visible:bg-white/55 sm:grid-cols-[96px_minmax(0,1fr)_48px] sm:gap-5 sm:py-7 ${EASE} shadow-[inset_0_0_0_0_var(--color-brand-500)] hover:shadow-[inset_3px_0_0_0_var(--color-brand-500)] focus-visible:shadow-[inset_3px_0_0_0_var(--color-brand-500)]`}
      >
        <span
          aria-hidden
          className={`font-display text-[30px] font-bold tabular-nums leading-none tracking-[0.01em] text-sand-300 transition-[color,transform] group-hover:translate-x-1.5 group-hover:text-brand-500 group-focus-visible:translate-x-1.5 group-focus-visible:text-brand-500 sm:text-[44px] ${EASE}`}
        >
          {num}
        </span>
        <span className="flex flex-col gap-1.5">
          <span
            className={`font-display text-xl font-bold uppercase leading-[1.05] tracking-[0.005em] text-ink-950 transition-transform group-hover:translate-x-1.5 group-focus-visible:translate-x-1.5 sm:text-[32px] ${EASE}`}
          >
            {tile.name}
          </span>
          {tile.blurb && (
            <span className="max-w-lg text-sm leading-[1.6] text-ink-500 sm:text-[15px]">
              {tile.blurb}
            </span>
          )}
        </span>
        <span
          className={`flex h-10 w-10 items-center justify-center border border-ink-950/15 text-brand-500 transition-[background,color,border-color,transform] group-hover:translate-x-1 group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:text-white group-focus-visible:border-brand-500 group-focus-visible:bg-brand-500 group-focus-visible:text-white sm:h-11 sm:w-11 ${EASE}`}
        >
          <ArrowRight className="h-4.5 w-4.5" />
        </span>
      </a>
    </li>
  );
}

/** Placeholder rows shown while the live sectors load — same geometry as the
 *  real row, so the list does not jump when data arrives. */
function RowSkeleton() {
  return (
    <li className="border-b border-ink-950/15">
      <div className="grid grid-cols-[56px_minmax(0,1fr)_44px] items-center gap-4 py-6 pl-1 sm:grid-cols-[96px_minmax(0,1fr)_48px] sm:gap-5 sm:py-7">
        <div className="h-8 w-10 animate-pulse rounded bg-ink-950/10 sm:h-10" />
        <div className="space-y-2.5">
          <div className="h-6 w-2/5 animate-pulse rounded bg-ink-950/10 sm:h-7" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-ink-950/10" />
        </div>
        <div className="h-10 w-10 animate-pulse bg-ink-950/10 sm:h-11 sm:w-11" />
      </div>
    </li>
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
        blurb: i.blurb,
      })),
    [data],
  );

  return (
    <section
      id="industries"
      className="relative overflow-hidden bg-sand-50 py-20 sm:py-26"
    >
      {/* Engineering grid, lifted by a soft light from the top-left. */}
      <div aria-hidden className="bg-grid-ink absolute inset-0" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_80%_at_15%_0%,rgb(255_255_255/0.9)_0%,rgb(246_244_242/0)_60%)]"
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-18">
          {/* Left — heading block. Rides alongside the index on large screens. */}
          <div className="lg:sticky lg:top-30">
            <Eyebrow>Sectors We Supply</Eyebrow>
            <h2 className="mt-4 text-balance font-display text-[34px] font-bold uppercase leading-none tracking-[-0.01em] text-ink-950 sm:text-5xl lg:text-[56px]">
              Powering the industries that build tomorrow
            </h2>
            <p className="mt-5 max-w-sm text-[17px] leading-[1.7] text-ink-500">
              Trusted by the industries that demand precision — from a single
              specialty size to a standing bulk schedule.
            </p>
            <a
              href="#contact"
              className="mt-9 inline-flex items-center gap-2.5 bg-brand-500 px-7 py-4 text-[13px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand-600"
            >
              Talk to our team
              <ArrowRight className="h-4 w-4" />
            </a>
            <div className="mt-10 flex items-center gap-3 border-t border-ink-950/12 pt-5">
              <Factory
                aria-hidden
                strokeWidth={1.5}
                className="h-5 w-5 shrink-0 text-steel-500"
              />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-steel-500">
                Sectors are managed in the admin dashboard
              </span>
            </div>
          </div>

          {/* Right — the sector index. */}
          <ol className="flex flex-col border-t border-ink-950/15">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
            ) : tiles.length === 0 ? (
              <li className="py-14 text-center">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-steel-500">
                  Sectors appear here once added in the admin dashboard
                </p>
              </li>
            ) : (
              tiles.map((tile, i) => (
                <SectorRow
                  key={tile.key}
                  tile={tile}
                  num={String(i + 1).padStart(2, "0")}
                />
              ))
            )}
          </ol>
        </div>
      </div>
    </section>
  );
}
