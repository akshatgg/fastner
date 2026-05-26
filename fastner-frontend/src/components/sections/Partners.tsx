import type { CSSProperties } from "react";
import { PARTNERS, type Partner } from "@/lib/site-data";
import SectionHeading from "@/components/ui/SectionHeading";

function LogoTile({ partner }: { partner: Partner }) {
  return (
    <div className="flex h-32 w-60 shrink-0 items-center justify-center rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:h-36 sm:w-72 lg:w-80 xl:w-96">
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
  // Only one set of the (few) partners per half — large tiles mean the 4 logos
  // span the screen, so no logo is ever visible twice at once. Two identical
  // halves let the track loop by -50% with no seam.
  return (
    <section id="partners" className="bg-ink-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Brands We Stock"
          title="Our Partners"
          description="We supply genuine, quality-assured products from the names professionals trust."
        />
      </div>

      <div className="group relative mt-12 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-ink-50 to-transparent sm:w-24"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-ink-50 to-transparent sm:w-24"
        />

        <div
          className="flex w-max animate-marquee group-hover:[animation-play-state:paused]"
          style={{ "--marquee-duration": "45s" } as CSSProperties}
        >
          {[0, 1].map((half) => (
            <div
              key={half}
              className="flex shrink-0 items-center gap-8 pr-8 sm:gap-12 sm:pr-12"
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
