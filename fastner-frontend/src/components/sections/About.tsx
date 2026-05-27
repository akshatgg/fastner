import { Check, ArrowRight } from "lucide-react";
import { HexNut } from "@/components/ui/FastenerArt";
import { ABOUT_POINTS } from "@/lib/site-data";

export default function About() {
  return (
    <section id="about" className="relative overflow-hidden bg-ink-950 text-white">
      <HexNut
        className="pointer-events-none absolute -right-16 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rotate-12 text-white/[0.04]"
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
        <div>
          <span className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-400">
            <span className="h-px w-6 bg-brand-500" />
            About IBC
          </span>
          <h2 className="font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
            The fastener partner built for modern industry
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-300">
            IBC is a new-age fastening supplier for manufacturers, builders and
            workshops. We make sourcing the right fastener simple — genuine
            quality and honest pricing, without the runaround.
          </p>
          <p className="mt-4 leading-relaxed text-ink-400">
            No middlemen — just dependable supply that keeps your work moving.
          </p>

          <a
            href="#contact"
            className="group mt-8 inline-flex items-center gap-2 rounded-md bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-600"
          >
            Partner with us
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        <ul className="space-y-4 lg:pl-10">
          {ABOUT_POINTS.map((point) => (
            <li
              key={point}
              className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5"
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
              <span className="text-base font-medium text-ink-100">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
