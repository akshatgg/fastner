import { ArrowRight } from "lucide-react";

import SectionHeading from "@/components/ui/SectionHeading";
import {
  SpecDrawing,
  SelectDrawing,
  DispatchDrawing,
} from "@/components/ui/HowItWorksArt";
import { HOW_IT_WORKS_STEPS } from "@/lib/site-data";

/** Drawing per step, in order — presentation, so it stays out of site-data. */
const STEP_ART = [SpecDrawing, SelectDrawing, DispatchDrawing];

// "How it works" — a three-step path from enquiry to delivery. The big numbers
// are the signature and carry the sequence (a genuine ordered process), so
// numbered markers are the right device here. Each step now opens with a
// technical drawing of what actually happens at that stage, and a hairline runs
// between the panels so the three read as one line of work. Static → Server
// Component.
export default function HowItWorks() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="Finding the Right Fastening Solution Is This Simple"
        />

        <ol className="mx-auto mt-14 grid max-w-5xl gap-10 sm:grid-cols-3 sm:gap-8">
          {HOW_IT_WORKS_STEPS.map((step, i) => {
            const Art = STEP_ART[i];
            return (
              <li
                key={step.num}
                // The connector rule sits in the grid gap, level with the middle
                // of the panel, so the three steps read as one continuous line.
                className="relative sm:[&:not(:first-child)]:before:absolute sm:[&:not(:first-child)]:before:right-full sm:[&:not(:first-child)]:before:top-[22%] sm:[&:not(:first-child)]:before:w-8 sm:[&:not(:first-child)]:before:border-t sm:[&:not(:first-child)]:before:border-dashed sm:[&:not(:first-child)]:before:border-steel-300 sm:[&:not(:first-child)]:before:content-['']"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand-100 ring-1 ring-sand-200">
                  <span
                    aria-hidden
                    className="absolute left-5 top-3 font-display text-4xl font-bold leading-none text-brand-500 sm:text-5xl"
                  >
                    {step.num}
                  </span>
                  {Art && (
                    <Art className="absolute inset-0 h-full w-full px-6 pb-5 pt-9 text-steel-500" />
                  )}
                </div>

                <h3 className="mt-6 font-display text-lg font-bold uppercase tracking-tight text-ink-900 sm:text-xl">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  {step.body}
                </p>
              </li>
            );
          })}
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
