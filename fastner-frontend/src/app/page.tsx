import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import CapabilityBar from "@/components/sections/CapabilityBar";
import Categories from "@/components/sections/Categories";
import Industries from "@/components/sections/Industries";
import Stats from "@/components/sections/Stats";
import Partners from "@/components/sections/Partners";
import HowItWorks from "@/components/sections/HowItWorks";
import Contact from "@/components/sections/Contact";

export default function Home() {
  // Section order: Hero → Capability bar → Our Range → Sectors → Stats →
  // Partners → How it works → Contact.
  //
  // The tone alternates deliberately down the page so a long scroll never
  // flattens out: charcoal (hero + capability bar) → white → sand → BRAND RED
  // (stats) → white → charcoal (how it works) → sand → charcoal (footer).
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        {/* Shares the hero's charcoal, so the two read as one opening block. */}
        <CapabilityBar />
        <Categories />
        <Industries />
        {/* The one full-red band on the page — caps the Sectors index. */}
        <Stats />
        <Partners />
        {/* "How it works" leads into the Get-in-touch CTA below it. */}
        <HowItWorks />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
