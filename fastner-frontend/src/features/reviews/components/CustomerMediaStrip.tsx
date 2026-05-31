"use client";

import { useState } from "react";

import type { Review, ReviewMedia } from "../types";
import MediaThumb from "./MediaThumb";
import MediaLightbox from "./MediaLightbox";

/** "Customer photos & videos" — all media aggregated across a product's reviews,
 *  shown as a horizontal strip that opens a lightbox on click. */
export default function CustomerMediaStrip({ reviews }: { reviews: Review[] }) {
  const media: ReviewMedia[] = reviews.flatMap((r) => r.media ?? []);
  const [open, setOpen] = useState<number | null>(null);

  if (media.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-900">
        Customer photos &amp; videos
      </h3>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {media.map((m, i) => (
          <MediaThumb key={i} media={m} onClick={() => setOpen(i)} />
        ))}
      </div>

      {open != null && (
        <MediaLightbox
          items={media}
          index={open}
          onClose={() => setOpen(null)}
          onNavigate={setOpen}
        />
      )}
    </div>
  );
}
