import Image from "next/image";
import { ArrowRight } from "lucide-react";

import Eyebrow from "@/components/ui/Eyebrow";
import { HOW_IT_WORKS_STEPS } from "@/lib/site-data";

// "How it works" — a three-step path from enquiry to delivery, set on charcoal
// so the sequence reads as a distinct chapter between the brand-owned Partners
// strip and the Contact block. The big outlined numerals are the signature and
// carry the sequence (a genuine ordered process), so numbered markers are the
// right device here. Each step opens with a photograph of that stage actually
// happening — the enquiry, the measurement, the dispatch — and a dashed rule
// runs between the panels so the three read as one line of work.
// Static → Server Component.
export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-ink-950 py-20 sm:py-26">
      <div aria-hidden className="bg-grid-white absolute inset-0" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end lg:gap-12">
          <div className="max-w-xl">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 text-balance font-display text-[34px] font-bold uppercase leading-none tracking-[-0.01em] text-white sm:text-5xl lg:text-[56px]">
              Finding the right fastening solution is this simple
            </h2>
          </div>
          <a
            href="/#contact"
            className="inline-flex shrink-0 items-center gap-2.5 bg-brand-500 px-7 py-4 text-[13px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand-600"
          >
            Talk to an Expert
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:mt-16">
          {HOW_IT_WORKS_STEPS.map((step, i) => {
            return (
              <li key={step.num} className="relative">
                {/* Connector sits in the grid gutter, level with the top of
                    the panel, so the three read as one run. */}
                {i > 0 && (
                  <span
                    aria-hidden
                    className="absolute right-full top-[20%] hidden w-10 border-t border-dashed border-steel-700 sm:block"
                  />
                )}
                <div className="relative aspect-[4/3] overflow-hidden bg-ink-900">
                  <Image
                    src={step.image}
                    alt={step.imageAlt}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover saturate-[0.9]"
                  />
                  {/* Darkens toward the top-left so the outlined numeral keeps
                      its contrast, and holds the panels in the section's
                      charcoal register rather than three bright windows. */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-br from-ink-950/85 via-ink-950/35 to-ink-950/10"
                  />
                  {/* Hairline sits above the photo — an inset shadow on the
                      container would paint under it. */}
                  <div
                    aria-hidden
                    className="absolute inset-0 ring-1 ring-inset ring-white/10"
                  />
                  <span
                    aria-hidden
                    className="absolute left-5 top-2.5 font-display text-[64px] font-bold leading-none text-transparent [-webkit-text-stroke:1.5px_var(--color-brand-500)]"
                  >
                    {step.num}
                  </span>
                </div>

                <h3 className="mt-7 font-display text-xl font-bold uppercase tracking-[0.01em] text-white sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-[1.7] text-ink-300">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
