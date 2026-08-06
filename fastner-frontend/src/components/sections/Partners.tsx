import type { CSSProperties } from "react";

import { PARTNERS, type Partner } from "@/lib/site-data";
import Eyebrow from "@/components/ui/Eyebrow";

/** One logo cell. The cells butt together across hairlines rather than sitting
 *  as separate cards — the strip reads as a single rule of brands. */
function LogoTile({ partner }: { partner: Partner }) {
  return (
    <div className="flex h-28 w-52 shrink-0 items-center justify-center border-r border-ink-100 p-7 sm:h-33 sm:w-70">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={partner.image}
        alt={`${partner.name} logo`}
        className="max-h-full max-w-full object-contain"
        draggable={false}
      />
    </div>
  );
}

export default function Partners() {
  // Two identical halves sit side by side so the track can loop by -50% with
  // no seam; the second is hidden from assistive tech.
  return (
    <section id="partners" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center sm:gap-10">
          <div>
            <Eyebrow>Brands We Stock</Eyebrow>
            <h2 className="mt-3 font-display text-[28px] font-bold uppercase leading-[1.05] tracking-[-0.005em] text-ink-950 sm:text-4xl lg:text-[40px]">
              Quality starts with the right brand
            </h2>
          </div>
          <p className="max-w-xs text-[15px] leading-[1.7] text-ink-500">
            Supplying genuine products from industry-leading brands.
          </p>
        </div>
      </div>

      <div className="relative mt-10 overflow-hidden border-y border-ink-100 sm:mt-11">
        {/* The strip sits on solid white, so colour-matched edge fades are exact. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent sm:w-30"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent sm:w-30"
        />

        <div
          className="group flex w-max animate-marquee hover:[animation-play-state:paused]"
          style={{ "--marquee-duration": "45s" } as CSSProperties}
        >
          {[0, 1].map((half) => (
            <div
              key={half}
              className="flex shrink-0 items-center"
              aria-hidden={half === 1}
            >
              {PARTNERS.map((partner) => (
                <LogoTile key={partner.name} partner={partner} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
