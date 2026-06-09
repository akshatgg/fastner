"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ANNOUNCEMENTS } from "@/lib/site-data";

const INTERVAL_MS = 4000;

/**
 * Slim promo bar above the hero carousel. Cycles through the promo messages
 * on a timer (each swap fades up), with arrows to step through manually.
 */
export default function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  const go = (next: number) =>
    setIndex((next + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % ANNOUNCEMENTS.length),
      INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative flex items-center justify-center border-b border-white/10 bg-ink-950 px-10 py-2.5 text-white sm:px-12"
      role="region"
      aria-label="Announcements"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={() => go(index - 1)}
        aria-label="Previous announcement"
        className="absolute left-3 text-white/50 transition-colors hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <p
        key={index}
        className="animate-announce text-center text-xs font-medium tracking-wide sm:text-sm"
      >
        {ANNOUNCEMENTS[index]}
      </p>

      <button
        type="button"
        onClick={() => go(index + 1)}
        aria-label="Next announcement"
        className="absolute right-3 text-white/50 transition-colors hover:text-white"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
