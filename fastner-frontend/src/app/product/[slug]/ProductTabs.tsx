"use client";

import { useState, type ReactNode } from "react";
import { ClipboardList, Info, MessageSquare } from "lucide-react";

/** Dimension drawing shown beside the spec table. Letters on the drawing (ØD,
 *  J, H, P, L) are the same ones the spec rows are keyed by, so the table and
 *  the diagram read together. */
const DIMENSION_DIAGRAM = "/assets/ranges/SSCF-P.avif";

type TabId = "reviews" | "technical" | "details";

const TABS: { id: TabId; label: string; icon: typeof Info }[] = [
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "technical", label: "Technical Specification", icon: Info },
  { id: "details", label: "Product Details", icon: ClipboardList },
];

/**
 * The three product tabs. Everything below the buy box lives here so the page
 * has one place to look rather than a long stack of panels: the spec table and
 * its dimension drawing, the full written description, and the reviews.
 *
 * Opens on Technical Specification — for a fastener the sizes and grade are
 * what the buyer came for.
 */
export default function ProductTabs({
  productName,
  specs,
  details,
  reviews,
  reviewCount,
}: {
  productName: string;
  specs: [string, unknown][];
  details: ReactNode;
  reviews: ReactNode;
  reviewCount?: number;
}) {
  const [tab, setTab] = useState<TabId>("technical");

  return (
    <section className="mt-14">
      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Product information"
        className="flex overflow-x-auto border-b border-ink-200"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              role="tab"
              id={`tab-${id}`}
              aria-selected={active}
              aria-controls={`panel-${id}`}
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-2.5 px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 sm:px-7 sm:text-sm ${
                active
                  ? "bg-brand-500 text-white"
                  : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
              }`}
            >
              <Icon
                aria-hidden
                // On the red plate the icon has to go white — brand-on-brand
                // would disappear.
                className={`h-4.5 w-4.5 shrink-0 ${active ? "text-white" : "text-ink-400"}`}
              />
              {label}
              {id === "reviews" && reviewCount != null && ` (${reviewCount})`}
            </button>
          );
        })}
      </div>

      {/* Technical Specification — table left, drawing right. */}
      {tab === "technical" && (
        <div
          role="tabpanel"
          id="panel-technical"
          aria-labelledby="tab-technical"
          className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14"
        >
          {specs.length > 0 ? (
            <dl className="min-w-0">
              {specs.map(([k, v], i) => (
                <div
                  key={k}
                  // Zebra striping does the row-separating work, so the table
                  // needs no rules of its own.
                  className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 px-4 py-3.5 text-sm ${
                    i % 2 === 0 ? "bg-ink-50" : "bg-white"
                  }`}
                >
                  <dt className="text-ink-600">{k}</dt>
                  <dd className="font-medium text-ink-900">{String(v)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-ink-400">
              No technical specification recorded for this product yet.
            </p>
          )}

          <figure className="min-w-0 lg:pt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DIMENSION_DIAGRAM}
              alt={`Dimension drawing showing the lettered measurements used in the ${productName} specification table`}
              className="w-full"
              loading="lazy"
            />
            <figcaption className="mt-3 text-xs text-ink-400">
              Letters match the measurements in the table.
            </figcaption>
          </figure>
        </div>
      )}

      {/* Product Details — the full written description. */}
      {tab === "details" && (
        <div
          role="tabpanel"
          id="panel-details"
          aria-labelledby="tab-details"
          className="pt-8"
        >
          <h2 className="font-display text-xl font-bold uppercase leading-tight text-ink-900 sm:text-2xl">
            {productName} Description
          </h2>
          <div className="mt-4">{details}</div>
        </div>
      )}

      {tab === "reviews" && (
        <div
          role="tabpanel"
          id="panel-reviews"
          aria-labelledby="tab-reviews"
          className="pt-2"
        >
          {reviews}
        </div>
      )}
    </section>
  );
}
