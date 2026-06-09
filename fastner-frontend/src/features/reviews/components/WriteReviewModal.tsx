"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { useSubmitReview } from "../queries";
import type { Review, ReviewMedia } from "../types";
import { StarPicker } from "./Stars";
import ReviewMediaUploader from "./ReviewMediaUploader";

/** Modal form to create or edit the signed-in user's review of a product. */
export default function WriteReviewModal({
  slug,
  existing,
  onClose,
}: {
  slug: string;
  existing: Review | null;
  onClose: () => void;
}) {
  const submit = useSubmitReview(slug);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [media, setMedia] = useState<ReviewMedia[]>(existing?.media ?? []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return;
    submit.mutate(
      {
        rating,
        title: title.trim() || null,
        body: body.trim() || null,
        media,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-md p-1.5 text-ink-400 transition hover:bg-ink-50 hover:text-ink-700"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="font-display text-xl font-bold uppercase text-ink-900">
          {existing ? "Edit your review" : "Write a review"}
        </h3>

        <label className="mt-4 block text-sm font-semibold text-ink-800">
          Overall rating
        </label>
        <div className="mt-1.5">
          <StarPicker value={rating} onChange={setRating} />
        </div>

        <label className="mt-4 block text-sm font-semibold text-ink-800">
          Add a headline
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's most important to know?"
          maxLength={255}
          className="mt-1.5 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />

        <label className="mt-4 block text-sm font-semibold text-ink-800">
          Write your review
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share details of your experience with this product…"
          rows={4}
          maxLength={4000}
          className="mt-1.5 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />

        <label className="mt-4 block text-sm font-semibold text-ink-800">
          Add photos or videos
        </label>
        <div className="mt-1.5">
          <ReviewMediaUploader value={media} onChange={setMedia} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={rating < 1 || submit.isPending}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            {submit.isPending ? "Submitting…" : "Submit review"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-ink-500 transition hover:text-ink-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
