import type { Metadata } from "next";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import RangeCatalog from "@/components/sections/RangeCatalog";
import { HexNut } from "@/components/ui/FastenerArt";

export const metadata: Metadata = {
  title: "Industrial Supply — IBC Fasteners",
  description:
    "Bulk supply solutions — browse IBC's industrial fastener range: bolts, nuts, washers, anchors and tools, across every grade, size and finish.",
};

export default function IndustrialSupplyPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-ink-950 text-white">
          <HexNut className="pointer-events-none absolute -right-20 -top-16 h-[26rem] w-[26rem] rotate-12 text-white/[0.04]" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <span className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-400">
              <span className="h-px w-6 bg-brand-500" />
              Industrial Supply
            </span>
            <h1 className="max-w-3xl font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Bulk Supply Solutions
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-300 sm:text-lg">
              Genuine, grade-marked fasteners for manufacturers, builders and
              workshops — bought in bulk, dispatched fast. Browse the full
              industrial range by category.
            </p>
          </div>
        </section>

        {/* Category grid */}
        <section className="bg-ink-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Shop by Category"
              title="Industrial Range"
              align="left"
              description="Find exactly what your project needs — across every grade, size and finish."
            />
            <div className="mt-10">
              <RangeCatalog range="industrial" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
