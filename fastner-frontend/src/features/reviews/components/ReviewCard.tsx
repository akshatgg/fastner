"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";

import type { Review } from "../types";
import { Stars } from "./Stars";
import MediaThumb from "./MediaThumb";
import MediaLightbox from "./MediaLightbox";

export default function ReviewCard({ review }: { review: Review }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const date = new Date(review.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const media = review.media ?? [];

  return (
    <div className="border-b border-ink-100 pb-6 last:border-0">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-600">
          {review.author_name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="text-sm font-semibold text-ink-900">
          {review.author_name}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Stars value={review.rating} size="sm" />
        {review.title && (
          <span className="text-sm font-semibold text-ink-900">{review.title}</span>
        )}
      </div>

      <div className="mt-1 flex items-center gap-2 text-xs text-ink-400">
        <span>Reviewed on {date}</span>
        {review.verified_purchase && (
          <span className="inline-flex items-center gap-1 font-semibold text-green-600">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified Purchase
          </span>
        )}
      </div>

      {review.body && (
        <p className="mt-2 whitespace-pre-line text-sm text-ink-600">
          {review.body}
        </p>
      )}

      {media.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {media.map((m, i) => (
            <MediaThumb key={i} media={m} size="sm" onClick={() => setLightbox(i)} />
          ))}
        </div>
      )}

      {lightbox != null && (
        <MediaLightbox
          items={media}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNavigate={setLightbox}
        />
      )}
    </div>
  );
}
