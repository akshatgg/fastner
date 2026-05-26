import { CATEGORIES } from "@/lib/site-data";
import SectionHeading from "@/components/ui/SectionHeading";

export default function Categories() {
  return (
    <section id="categories" className="bg-ink-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Range"
          title="Shop by Category"
          description="Find exactly what your project needs — across every grade, size and finish."
        />

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.name}
              href="#contact"
              className="group flex flex-col items-center rounded-xl border border-ink-100 bg-white p-4 text-center shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
            >
              <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-ink-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                  draggable={false}
                  loading="lazy"
                />
              </div>
              <h3 className="mt-3 font-display text-sm font-bold uppercase tracking-wide text-ink-900 sm:text-base">
                {cat.name}
              </h3>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
