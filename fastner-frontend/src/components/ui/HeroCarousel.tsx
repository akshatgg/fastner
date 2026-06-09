"use client";

import { useCallback, useEffect, useState, type TransitionEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HERO_SLIDES as SLIDES } from "@/lib/site-data";

/** Shared button styling; each slide adds its own translucent colour via `cta.className`. */
const BTN_BASE =
  "absolute bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg ring-1 backdrop-blur-md transition-all sm:bottom-14 sm:gap-2.5 sm:px-10 sm:py-4 sm:text-base";

const N = SLIDES.length;
/**
 * Clone the last slide before the first and the first slide after the last, so
 * the track reads [lastClone, ...SLIDES, firstClone]. Real slides live at track
 * positions 1..N; positions 0 and N+1 are the clones used for a seamless wrap.
 */
const TRACK = [SLIDES[N - 1], ...SLIDES, SLIDES[0]];

const INTERVAL_MS = 4000;

/**
 * Full-bleed, edge-to-edge hero carousel with a true circular loop. Slides
 * scroll horizontally on a timer (paused on hover) and can be driven with the
 * arrows or dots. When the track slides onto a cloned edge slide, it snaps
 * (transition off) to the matching real slide on the next frame — so advancing
 * past the last slide continues forward instead of rewinding.
 *
 * The frame is locked to 2047x921 (~20:9); images fill it (object-cover), so
 * every slide must be exported at that size. Each slide overlays its own CTA.
 */
export default function HeroCarousel() {
  const [pos, setPos] = useState(1); // start on the first real slide
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);

  // Clamp to the clone bounds [0, N+1] so rapid clicks can never overshoot the
  // track into empty space (which left a blank/black band and broke the wrap).
  const next = useCallback(() => {
    setAnimate(true);
    setPos((p) => Math.min(p + 1, N + 1));
  }, []);

  const prev = useCallback(() => {
    setAnimate(true);
    setPos((p) => Math.max(p - 1, 0));
  }, []);

  const goTo = useCallback((realIndex: number) => {
    setAnimate(true);
    setPos(realIndex + 1);
  }, []);

  // Auto-advance (resets whenever the position changes, e.g. via manual nav).
  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, pos, next]);

  // After the slide onto a clone finishes, jump to the matching real slide
  // with the transition disabled so the wrap is invisible.
  const handleTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // ignore bubbling child transitions
    if (pos === N + 1) {
      setAnimate(false);
      setPos(1);
    } else if (pos === 0) {
      setAnimate(false);
      setPos(N);
    }
  };

  // Re-enable the transition on the frame after a snap.
  useEffect(() => {
    if (animate) return;
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setAnimate(true)),
    );
    return () => cancelAnimationFrame(id);
  }, [animate]);

  const activeIndex = (pos - 1 + N) % N;

  return (
    <div
      className="group relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="IBC posters"
    >
      {/* Track */}
      <div
        className={`flex ${animate ? "transition-transform duration-700 ease-out" : ""}`}
        style={{ transform: `translateX(-${pos * 100}%)` }}
        onTransitionEnd={handleTransitionEnd}
      >
        {TRACK.map((slide, i) => (
          <div
            key={i}
            className="relative aspect-[2047/921] w-full shrink-0"
            style={{ backgroundColor: slide.bg }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.src}
              alt={slide.alt}
              className="h-full w-full object-cover"
              draggable={false}
            />
            {slide.caption && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-ink-950 drop-shadow-sm sm:text-6xl lg:text-7xl">
                  {slide.caption.heading}
                </h2>
                {slide.caption.sub && (
                  <p className="mt-3 max-w-md text-sm text-ink-950/70 sm:mt-4 sm:max-w-2xl sm:text-xl">
                    {slide.caption.sub}
                  </p>
                )}
              </div>
            )}
            <a href={slide.cta.href} className={`${BTN_BASE} ${slide.cta.className}`}>
              <slide.cta.Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              {slide.cta.label}
            </a>
          </div>
        ))}
      </div>

      {/* Prev / Next */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-ink-950/40 p-2 text-white opacity-0 backdrop-blur-sm transition hover:bg-ink-950/70 group-hover:opacity-100 sm:flex"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-ink-950/40 p-2 text-white opacity-0 backdrop-blur-sm transition hover:bg-ink-950/70 group-hover:opacity-100 sm:flex"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === activeIndex}
            className={`h-2 rounded-full shadow transition-all ${
              i === activeIndex ? "w-6 bg-brand-500" : "w-2 bg-white/60 hover:bg-white/90"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
