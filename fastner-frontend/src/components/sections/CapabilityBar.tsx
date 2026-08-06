import { CAPABILITIES } from "@/lib/site-data";

/**
 * Proof-point bar that sits directly under the hero, sharing its charcoal so
 * the two read as one block before the page opens into white. Four items on a
 * single row on desktop, two-up on tablet, stacked on mobile — the hairline
 * dividers follow suit. Static → Server Component.
 */
export default function CapabilityBar() {
  return (
    <section aria-label="What we guarantee" className="bg-ink-950">
      <div className="mx-auto grid max-w-7xl grid-cols-1 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {CAPABILITIES.map(({ icon: Icon, title, caption }, i) => (
          <div
            key={title}
            // Dividers only where an item actually has a neighbour to its left,
            // which differs per breakpoint — hence the explicit column rules.
            className={[
              "flex items-center gap-3.5 border-white/8 py-6",
              i > 0 && "border-t sm:border-t-0",
              i % 2 === 1 && "sm:border-l sm:pl-7",
              i % 2 === 0 && "sm:pr-7",
              "lg:border-l lg:pr-7 lg:pl-7",
              i === 0 && "lg:border-l-0 lg:pl-0",
              i === 3 && "lg:pr-0",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Icon
              aria-hidden
              strokeWidth={1.75}
              className="h-6.5 w-6.5 shrink-0 text-brand-500"
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-display text-base font-semibold uppercase tracking-[0.04em] text-white">
                {title}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-400">
                {caption}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
