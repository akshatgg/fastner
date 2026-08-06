import { ArrowRight } from "lucide-react";

import Eyebrow from "@/components/ui/Eyebrow";
import { RANGE_CARDS } from "@/lib/site-data";

// "Our Range" — two entry points into the catalog, each linking to its own
// storefront page (`/industrial-supply`, `/diy-home`). The panels are
// full-bleed and butt together across a 2px brand-red seam, so the section has
// no bottom padding: the artwork runs to the edge of the viewport and hands
// straight over to the Sectors band. Static → Server Component; plain <a>
// navigation matches the site's full-page nav (see layout bfcache shim).
export default function Categories() {
  return (
    <section id="categories" className="bg-white pt-16 sm:pt-22">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading left, standfirst right, baselines aligned on desktop. */}
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end lg:gap-12">
          <div className="max-w-2xl">
            <Eyebrow>Our Range</Eyebrow>
            <h2 className="mt-4 text-balance font-display text-[34px] font-bold uppercase leading-[0.98] tracking-[-0.01em] text-ink-950 sm:text-5xl lg:text-[60px]">
            Fasteners For Every Need
            </h2>
          </div>
          <p className="max-w-sm pb-2 text-base leading-[1.7] text-ink-500">
          Two ranges, one standard of quality — pick the side that fits your work.
          </p>
        </div>
      </div>

      {/* The seam between the panels is the red showing through a 2px gap. */}
      <div className="mt-10 grid gap-0.5 bg-brand-500 sm:mt-14 sm:grid-cols-2">
        {RANGE_CARDS.map((card, i) => (
          <a
            key={card.href}
            href={card.href}
            className="group relative flex min-h-[420px] flex-col justify-end overflow-hidden bg-ink-950 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white sm:min-h-[520px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover saturate-[0.85]"
              draggable={false}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-ink-950/95 from-0% via-ink-950/70 via-[38%] to-ink-950/15"
            />
            {/* Diagonal accent that sweeps across on hover — the one moving
                part per panel. */}
            <span
              aria-hidden
              className="pointer-events-none absolute -left-[30%] -top-[20%] h-[140%] w-[170%] -translate-x-[118%] skew-x-[-16deg] bg-brand-500 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-[58%]"
            />
            {/* Hazard rule marks the start of the pair. */}
            {i === 0 && (
              <span
                aria-hidden
                className="bg-hazard absolute left-0 top-0 h-full w-2"
              />
            )}

            <div
              className={`relative p-8 sm:p-12 ${i === 0 ? "sm:pl-16" : ""}`}
            >
              <h3 className="font-display text-[34px] font-bold uppercase leading-[0.98] tracking-[-0.01em] text-white sm:text-5xl lg:text-[52px]">
                {card.titleLines[0]}
                <br />
                {card.titleLines[1]}
              </h3>
              <p className="mt-4 max-w-md text-base leading-[1.65] text-ink-200">
                {card.subtitle}
              </p>
              <span className="mt-8 inline-flex items-center gap-2.5 border border-white/45 px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.1em] text-white transition-colors duration-300 group-hover:border-ink-950 group-hover:bg-ink-950">
                {card.cta}
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
