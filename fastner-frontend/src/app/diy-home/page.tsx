import type { Metadata } from "next";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import RangeCatalog from "@/components/sections/RangeCatalog";
import { HexNut } from "@/components/ui/FastenerArt";

export const metadata: Metadata = {
  title: "DIY & Home — IBC Fasteners",
  description:
    "A curated range of fasteners for everyday home and DIY projects — the right screws, anchors and fixings for jobs around the house.",
};

export default function DiyHomePage() {
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
              DIY &amp; Home
            </span>
            <h1 className="max-w-3xl font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Curated Range for Everyday Home Projects
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-300 sm:text-lg">
              The right screws, anchors and fixings for jobs around the house —
              hand-picked and easy to buy in the quantities a home project needs.
            </p>
          </div>
        </section>

        {/* Category grid */}
        <section className="bg-ink-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Shop by Category"
              title="DIY & Home Range"
              align="left"
              description="Everyday fixings, sorted by category — pick what your project needs."
            />
            <div className="mt-10">
              <RangeCatalog
                range="diy"
                emptyTitle="This range is being stocked."
                emptyHint="We're curating a home & DIY selection. In the meantime, explore our industrial range or get in touch."
                emptyAction={
                  <>
                    <a
                      href="/industrial-supply"
                      className="inline-flex items-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
                    >
                      Explore Industrial Supply
                    </a>
                    <a
                      href="/#contact"
                      className="inline-flex items-center rounded-lg border border-ink-200 px-5 py-2.5 text-sm font-bold text-ink-700 transition hover:border-ink-300 hover:bg-white"
                    >
                      Contact us
                    </a>
                  </>
                }
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
