import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Categories from "@/components/sections/Categories";
import Industries from "@/components/sections/Industries";
import Partners from "@/components/sections/Partners";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Categories />
        <Industries />
        <Partners />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
