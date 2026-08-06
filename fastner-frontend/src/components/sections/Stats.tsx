"use client";

import { useEffect, useRef, useState } from "react";

import { usePublicHomepageStats } from "@/features/settings/queries";

// How long the count-up runs, and the ease that makes it decelerate into the
// final figure (fast start, gentle landing).
const DURATION_MS = 1600;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * "By the numbers" band — the four headline figures (industries, customers,
 * categories, products) that resolve live from the backend, with any admin
 * override applied. This is the one full-brand-red block on the page: it lands
 * between the Sectors index and the Partners strip and carries the page's
 * strongest colour, so nothing else on the homepage competes with it.
 *
 * Each number counts up from zero the first time the band scrolls into view (an
 * IntersectionObserver arms a single rAF loop). Respects
 * `prefers-reduced-motion` by snapping straight to the final values. Renders
 * nothing until there is at least one active stat.
 */
export default function Stats() {
  const { data: stats } = usePublicHomepageStats();
  const sectionRef = useRef<HTMLElement>(null);
  // A single 0→1 progress value drives every counter, so one animation loop
  // handles all figures regardless of how many there are.
  const [progress, setProgress] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    // Re-runs once the stats load and the band actually mounts. `startedRef`
    // guards against arming the animation more than once.
    if (!el || !stats?.length || startedRef.current) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const run = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      if (reduced) {
        setProgress(1);
        return;
      }
      let startTs: number | null = null;
      const tick = (ts: number) => {
        startTs ??= ts;
        const t = Math.min((ts - startTs) / DURATION_MS, 1);
        setProgress(easeOutCubic(t));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stats]);

  if (!stats?.length) return null;

  return (
    <section
      ref={sectionRef}
      aria-label="IBC by the numbers"
      className="relative overflow-hidden bg-brand-500"
    >
      {/* Vertical rules only — horizontals would cut the figures' baseline. */}
      <div aria-hidden className="bg-grid-rule absolute inset-0" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-6 py-10 md:grid-cols-4 md:gap-y-0 lg:px-8">
        {stats.map((stat, i) => {
          // Round the target scaled by the shared progress; once progress hits
          // 1 this is exactly the final figure.
          const shown = Math.round(stat.value * progress);
          return (
            <div
              key={stat.key}
              // Every item but the first carries the divider on its left, at
              // whichever breakpoint it actually has a neighbour there.
              className={[
                "flex flex-col items-start border-white/28",
                i % 2 === 1 && "border-l pl-6",
                i % 2 === 0 && "pr-6 md:pr-8",
                "md:border-l md:pl-8",
                i === 0 && "md:border-l-0 md:pl-0",
                i === 3 && "md:pr-0",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="font-display text-4xl font-bold tabular-nums leading-none tracking-[-0.02em] text-white sm:text-[54px]">
                {shown.toLocaleString()}
                <span className="opacity-60">{stat.suffix}</span>
              </span>
              <span className="mt-2 whitespace-nowrap font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-white/82 sm:text-[11px]">
                {stat.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
