"use client";

import { Play } from "lucide-react";

import type { ReviewMedia } from "../types";

/** A square thumbnail for one piece of review media. Videos show a play badge. */
export default function MediaThumb({
  media,
  size = "md",
  onClick,
}: {
  media: ReviewMedia;
  size?: "sm" | "md";
  onClick?: () => void;
}) {
  const box = size === "sm" ? "h-16 w-16" : "h-24 w-24";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative ${box} shrink-0 overflow-hidden rounded-lg border border-ink-100 bg-ink-50`}
    >
      {media.type === "video" ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <video
            src={media.url}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Play className="h-6 w-6 fill-white text-white" />
          </span>
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.url}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      )}
    </button>
  );
}
