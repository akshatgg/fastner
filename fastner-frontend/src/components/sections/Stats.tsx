"use client";

import { useEffect, useRef, useState } from "react";

import { usePublicHomepageStats } from "@/features/settings/queries";

// How long the count-up runs, and the ease that makes it decelerate into the
// final figure (fast start, gentle landing).
const DURATION_MS = 1600;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * "By the numbers" bar — the four headline figures (industries, customers,
 * categories, products) that resolve live from the backend, with any admin
 * override applied. Each number counts up from zero the first time the bar
 * scrolls into view (an IntersectionObserver arms a single rAF loop), mirroring
 * the reference design. Respects `prefers-reduced-motion` by snapping straight
 * to the final values. Renders nothing until there is at least one active stat.
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
      className="border-y border-ink-100 bg-ink-50"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-12 px-4 py-16 sm:px-6 md:grid-cols-4 md:gap-y-0 lg:px-8">
        {stats.map((stat) => {
          // Round the target scaled by the shared progress; once progress hits
          // 1 this is exactly the final figure.
          const shown = Math.round(stat.value * progress);
          return (
            <div
              key={stat.key}
              // A short, centred red rule sits before every item except the
              // first — only on md+, where the four sit in a single row.
              className="relative flex flex-col items-center px-4 text-center md:[&:not(:first-child)]:before:absolute md:[&:not(:first-child)]:before:left-0 md:[&:not(:first-child)]:before:top-1/2 md:[&:not(:first-child)]:before:h-12 md:[&:not(:first-child)]:before:w-px md:[&:not(:first-child)]:before:-translate-y-1/2 md:[&:not(:first-child)]:before:bg-brand-500 md:[&:not(:first-child)]:before:content-['']"
            >
              <span className="font-display text-4xl font-bold tabular-nums tracking-tight text-ink-900 sm:text-5xl">
                {shown.toLocaleString()}
                <span className="text-brand-500">{stat.suffix}</span>
              </span>
              <span className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-ink-500 sm:text-sm">
                {stat.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
