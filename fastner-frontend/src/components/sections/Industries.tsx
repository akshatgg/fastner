"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePublicIndustries } from "@/features/industries/queries";
import SectionHeading from "@/components/ui/SectionHeading";

/** Advance one card every this many ms. */
const STEP_MS = 3000;
/** Must match the `gap-6` (1.5rem) on the track below. */
const GAP_PX = 24;
/** Only scroll once there are more than this many cards; fewer sit static. */
const SCROLL_THRESHOLD = 3;

type Tile = { key: string; name: string; image: string | null; blurb: string | null };

function IndustryCard({ tile }: { tile: Tile }) {
  return (
    <a
      href="#contact"
      className="group/card relative block aspect-[4/3] w-56 shrink-0 overflow-hidden rounded-2xl shadow-card ring-1 ring-ink-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:w-80 lg:w-96"
    >
      {tile.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tile.image}
          alt={tile.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-110"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-900">
          <span className="font-display text-6xl font-bold text-ink-700">
            {tile.name.trim().charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      {/* Readability gradient — darkens the lower half behind the text. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-transparent transition-all duration-300 group-hover/card:from-ink-950/95"
      />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <span className="block h-1 w-10 bg-brand-500 transition-all duration-300 group-hover/card:w-16" />
        <h3 className="mt-3 font-display text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">
          {tile.name}
        </h3>
        {tile.blurb && (
          <p className="mt-1.5 text-sm leading-snug text-ink-200 sm:text-base">
            {tile.blurb}
          </p>
        )}
      </div>
    </a>
  );
}

export default function Industries() {
  const { data, isLoading } = usePublicIndustries();

  // Live, admin-managed industries (see /admin/industries).
  const tiles = useMemo<Tile[]>(
    () =>
      (data ?? []).map((i) => ({
        key: i.id,
        name: i.name,
        image: i.image_url,
        blurb: i.blurb,
      })),
    [data],
  );

  // Only run the scrolling carousel when there are enough cards to overflow.
  // With 3 or fewer, show them static so a single industry doesn't get
  // duplicated or animated.
  const animated = tiles.length > SCROLL_THRESHOLD;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [step, setStep] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // Measure one card's width (+ gap) so we can shift by exactly one card.
  // Re-measures when the tile set changes (e.g. after live data loads).
  useEffect(() => {
    if (!animated) return;
    const measure = () => {
      const first = trackRef.current?.firstElementChild as HTMLElement | null;
      if (first) setStep(first.offsetWidth + GAP_PX);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [animated, tiles.length]);

  // Auto-advance on a timer; paused on hover.
  useEffect(() => {
    if (!animated || paused) return;
    const id = setInterval(() => setIndex((i) => i + 1), STEP_MS);
    return () => clearInterval(id);
  }, [animated, paused]);

  // After sliding past the first full set (the duplicate looks identical),
  // snap back to the start with no transition for a seamless loop.
  useEffect(() => {
    if (animate) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [animate]);

  const onTransitionEnd = () => {
    if (index >= tiles.length) {
      setAnimate(false);
      setIndex(0);
    }
  };

  // Duplicated so there are always cards entering from the right.
  const cards = [...tiles, ...tiles];

  return (
    <section id="industries" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Sectors We Supply"
          title="Industries We Serve"
          description="From the workshop floor to the factory line, IBC fasteners hold together the work of every sector — engineered to the right grade, finish and tolerance for the job."
        />
      </div>

      {isLoading ? (
        <div className="mx-auto mt-14 flex max-w-7xl gap-6 px-4 sm:px-6 lg:px-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] w-56 shrink-0 animate-pulse rounded-2xl bg-ink-100 sm:w-80 lg:w-96"
            />
          ))}
        </div>
      ) : tiles.length === 0 ? (
        <p className="mt-14 text-center text-sm text-ink-400">
          No industries available yet.
        </p>
      ) : !animated ? (
        /* Few enough to fit — static, centered, no duplication or animation. */
        <div className="mx-auto mt-14 flex max-w-7xl flex-wrap justify-center gap-6 px-4 sm:px-6 lg:px-8">
          {tiles.map((tile) => (
            <IndustryCard key={tile.key} tile={tile} />
          ))}
        </div>
      ) : (
        /* Full-bleed showcase. Cards step one position left on a timer; the row
           pauses on hover. Edge fades hide the wrap-around. */
        <div
          className="relative mt-14 overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-24"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-24"
          />

          <div
            ref={trackRef}
            className="flex gap-6"
            style={{
              transform: `translateX(-${index * step}px)`,
              transition: animate ? "transform 700ms ease" : "none",
            }}
            onTransitionEnd={onTransitionEnd}
          >
            {cards.map((tile, i) => (
              <IndustryCard key={`${tile.key}-${i}`} tile={tile} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
