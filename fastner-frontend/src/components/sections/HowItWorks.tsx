import { ArrowRight } from "lucide-react";

import SectionHeading from "@/components/ui/SectionHeading";
import { HOW_IT_WORKS_STEPS } from "@/lib/site-data";

// "How it works" — a simple three-step path from enquiry to delivery. The big
// numbers are the signature and carry the sequence (a genuine ordered process),
// so numbered markers are the right device here. Static → Server Component.
export default function HowItWorks() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="Finding the Right Fastening Solution Is This Simple"
        />

        <ol className="mx-auto mt-14 grid max-w-5xl gap-10 sm:grid-cols-3 sm:gap-8">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <li key={step.num} className="relative">
              <div className="flex items-center gap-4">
                <span className="font-display text-5xl font-bold leading-none text-brand-500 sm:text-6xl">
                  {step.num}
                </span>
                {/* Hairline that reads as a timeline rule between steps. */}
                <span aria-hidden className="h-px flex-1 bg-ink-200" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold uppercase tracking-tight text-ink-900 sm:text-xl">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-14 flex justify-center">
          <a
            href="/#contact"
            className="group inline-flex items-center gap-2 rounded-md bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-600"
          >
            Talk to an Expert
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}
