import HeroCarousel from "@/components/ui/HeroCarousel";

export default function Hero() {
  return (
    <section id="home" className="relative bg-ink-950">
      <HeroCarousel />
      {/* Hazard accent strip */}
      <div aria-hidden className="bg-hazard h-3 w-full" />
    </section>
  );
}
