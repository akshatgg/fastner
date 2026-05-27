"use client";

import { useEffect, useRef, useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import { PROCESS_STEPS } from "@/lib/site-data";

export default function ProcessTimeline() {
  const [visible, setVisible] = useState<Set<number>>(new Set());
  const itemsRef = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    // Respect reduced-motion: reveal everything immediately, skip the animation.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(new Set(PROCESS_STEPS.map((_, i) => i)));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number((entry.target as HTMLElement).dataset.index);
          setVisible((prev) => {
            const next = new Set(prev);
            next.add(idx);
            return next;
          });
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" },
    );

    itemsRef.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="process" className="bg-ink-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How We Work"
          title="Our Process"
          description="We consult with our clients to understand their specific needs and offer the right product to meet their requirements."
        />

        <ol className="relative mx-auto mt-16 max-w-6xl">
          {/* Vertical spine — left on mobile, centered on desktop. */}
          <span
            aria-hidden
            className="absolute left-6 top-2 h-[calc(100%-1rem)] w-0.5 bg-ink-200 sm:left-1/2 sm:-translate-x-1/2"
          />

          {PROCESS_STEPS.map((p, i) => {
            const Icon = p.icon;
            const onRight = i % 2 === 0; // alternate sides on desktop
            const isVisible = visible.has(i);
            return (
              <li
                key={p.title}
                ref={(el) => {
                  itemsRef.current[i] = el;
                }}
                data-index={i}
                className="relative mb-10 last:mb-0 sm:mb-14 sm:grid sm:grid-cols-2 sm:items-center sm:gap-x-10"
              >
                {/* Numbered badge sitting on the spine */}
                <span
                  className={[
                    "absolute left-6 top-1 z-10 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-brand-500 font-display text-lg font-bold text-white shadow-md ring-4 ring-ink-50 transition-all duration-500 ease-out sm:left-1/2 sm:top-1/2 sm:-translate-y-1/2",
                    isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0",
                  ].join(" ")}
                >
                  {i + 1}
                </span>

                {/* Card */}
                <div
                  className={[
                    "ml-16 sm:ml-0",
                    onRight ? "sm:col-start-2" : "sm:col-start-1",
                    "transition-all duration-700 ease-out",
                    isVisible
                      ? "translate-x-0 translate-y-0 opacity-100"
                      : `translate-y-6 opacity-0 ${onRight ? "sm:translate-x-10" : "sm:-translate-x-10"}`,
                  ].join(" ")}
                >
                  <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon className="h-6 w-6" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-4 font-display text-xl font-bold uppercase tracking-wide text-ink-900">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">
                      {p.body}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
