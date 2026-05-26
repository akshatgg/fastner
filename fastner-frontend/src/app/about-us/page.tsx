import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import ProcessTimeline from "@/components/sections/ProcessTimeline";
import { HexNut } from "@/components/ui/FastenerArt";
import { SITE } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "About Us — IBC Fasteners",
  description:
    "IBC is a trusted supplier of genuine, quality-assured industrial fasteners and tools — backed by deep stock, brand partnerships and people who know fasteners.",
};

export default function AboutUsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-ink-950 text-white">
          <HexNut className="pointer-events-none absolute -right-20 -top-16 h-[26rem] w-[26rem] rotate-12 text-white/[0.04]" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <span className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-400">
              <span className="h-px w-6 bg-brand-500" />
              About {SITE.name}
            </span>
            <h1 className="max-w-3xl font-display text-4xl font-bold uppercase leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your trusted source for quality fasteners
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-300">
              IBC supplies genuine, quality-assured industrial fasteners and
              tools to manufacturers, builders and workshops. We make sourcing
              the right fastener simple — backed by deep stock, trusted brands
              and people who know the products inside out.
            </p>
          </div>
        </section>

        {/* Our Products */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <div>
              <SectionHeading
                eyebrow="What We Offer"
                title="Our Products"
                align="left"
              />
              <p className="mt-6 text-base leading-relaxed text-ink-600">
                At {SITE.name}, we offer the largest variety of fasteners in terms
                of dimensions — stocking and supplying threading sizes from as small
                as M1.6 all the way up to M56 in most fasteners. For some structural
                applications, the threading size goes up to M80. We also hold a
                strong supply position in the Imperial Fastener range, with bolts
                and nuts in BSW, UNC, UNF and BSF series. Every fastener we offer
                complies with BS, IS &amp; DIN standards and is known for corrosion
                resistance and durability.
              </p>
              <Link
                href="/#categories"
                className="group mt-8 inline-flex items-center gap-2 rounded-md bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-600"
              >
                View Our Products
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/image.png"
                alt="IBC fastener range"
                className="aspect-[16/10] w-full rounded-xl object-cover shadow-card ring-1 ring-ink-100"
                draggable={false}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/image.png"
                alt="IBC fasteners close-up"
                className="aspect-[16/10] w-full rounded-xl object-cover shadow-card ring-1 ring-ink-100"
                draggable={false}
              />
            </div>
          </div>
        </section>

        {/* How We Work — scroll-revealed timeline */}
        <ProcessTimeline />

        {/* Our Team */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Users className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <SectionHeading eyebrow="The People" title="Our Team" />
            <p className="mt-6 text-base leading-relaxed text-ink-600">
              Behind every order is a team that actually knows fasteners. From
              helping you identify the right grade to sorting out a tricky
              specialty size, our people bring practical, hands-on knowledge to
              every enquiry — so you can buy with confidence.
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
