import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Categories from "@/components/sections/Categories";
import Industries from "@/components/sections/Industries";
import Stats from "@/components/sections/Stats";
import Partners from "@/components/sections/Partners";
import HowItWorks from "@/components/sections/HowItWorks";
import Contact from "@/components/sections/Contact";

export default function Home() {
  // Section order: Hero → Categories → Industries → Stats → Partners →
  // How it works → Contact.
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Categories />
        <Industries />
        {/* Stats bar caps the Sectors reveal, then flows into the brand logos. */}
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
