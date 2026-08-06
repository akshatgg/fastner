import { ArrowRight } from "lucide-react";

import SectionHeading from "@/components/ui/SectionHeading";
import { HexNut } from "@/components/ui/FastenerArt";
import { RANGE_CARDS } from "@/lib/site-data";

// "Our Range" — two entry points into the catalog. Each card links to its own
// storefront page (`/industrial-supply`, `/diy-home`) that lists the categories
// tagged with that range. Static/presentational, so it stays a Server Component;
// plain <a> navigation matches the site's full-page nav (see layout bfcache shim).
export default function Categories() {
  return (
    <section id="categories" className="bg-ink-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Range"
          title="Fasteners For Every Need"
          description="Two ranges, one standard of quality — pick the side that fits your work."
        />

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2">
          {RANGE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.href}
                href={card.href}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white p-8 shadow-card outline-none transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 sm:p-10"
              >
                {/* Faint fastener watermark, bleeding off the corner. */}
                <HexNut className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rotate-12 text-ink-950/[0.035] transition-transform duration-500 group-hover:rotate-[24deg]" />

                {/* Brand accent bar that draws in on hover. */}
                <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-brand-500 transition-transform duration-300 group-hover:scale-x-100" />

                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors duration-200 group-hover:bg-brand-500 group-hover:text-white">
                  <Icon className="h-7 w-7" strokeWidth={1.75} />
                </span>

                <span className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                  {card.eyebrow}
                </span>
                <h3 className="mt-2 font-display text-2xl font-bold uppercase leading-tight tracking-tight text-ink-900 sm:text-3xl">
                  {card.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-500">
                  {card.subtitle}
                </p>

                <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink-900 transition-colors group-hover:text-brand-600">
                  {card.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
