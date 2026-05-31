"use client";

import { useMemo, useState } from "react";

import {
  useProductReviews,
  useReviewEligibility,
} from "@/features/reviews/queries";
import { useAuthStore } from "@/lib/store/auth-store";
import RatingSummary from "@/features/reviews/components/RatingSummary";
import ReviewCard from "@/features/reviews/components/ReviewCard";
import CustomerMediaStrip from "@/features/reviews/components/CustomerMediaStrip";
import WriteReviewModal from "@/features/reviews/components/WriteReviewModal";
import AuthPromptModal from "@/features/reviews/components/AuthPromptModal";

export default function ProductReviews({ slug }: { slug: string }) {
  const { data, isLoading } = useProductReviews(slug);
  const accessToken = useAuthStore((s) => s.accessToken);
  const authed = Boolean(accessToken);
  const { data: eligibility } = useReviewEligibility(slug);

  const [activeStar, setActiveStar] = useState<number | null>(null);
  const [writeOpen, setWriteOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  const summary = data?.summary;
  const reviews = useMemo(() => data?.items ?? [], [data]);
  const hasReviews = reviews.length > 0;
  const filtered = useMemo(
    () => (activeStar ? reviews.filter((r) => r.rating === activeStar) : reviews),
    [reviews, activeStar],
  );

  const handleWriteClick = () => {
    if (authed) setWriteOpen(true);
    else setAuthPromptOpen(true);
  };

  const writeLabel = eligibility?.already_reviewed
    ? "Edit your review"
    : "Write a product review";

  return (
    <section className="mt-14 border-t border-ink-100 pt-10">
      <div className="grid gap-10 lg:grid-cols-[300px_1fr]">
        {/* ---------- Left rail (always shown, Amazon-style) ---------- */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <RatingSummary
            summary={summary}
            loading={isLoading}
            activeStar={activeStar}
            onStarFilter={setActiveStar}
          />

          {/* Review this product */}
          <div className="mt-8 border-t border-ink-100 pt-6">
            <h3 className="font-display text-base font-bold uppercase text-ink-900">
              Review this product
            </h3>
            <p className="mt-1 text-sm text-ink-500">
              Share your thoughts with other customers.
            </p>
            <button
              type="button"
              onClick={handleWriteClick}
              className="mt-4 w-full rounded-full border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-800 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600"
            >
              {writeLabel}
            </button>
          </div>
        </div>

        {/* ---------- Right column: media + reviews ---------- */}
        <div>
          {isLoading ? (
            <p className="text-sm text-ink-400">Loading reviews…</p>
          ) : !hasReviews ? (
            <div className="rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-16 text-center">
              <p className="text-lg font-semibold text-ink-900">No reviews yet</p>
              <p className="mt-1 text-sm text-ink-500">
                Be the first to share your thoughts on this product.
              </p>
            </div>
          ) : (
            <>
              <CustomerMediaStrip reviews={reviews} />

              <div className="mt-8">
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-ink-900">
                  Top reviews
                </h3>
                {activeStar && (
                  <p className="mt-1 text-sm text-ink-500">
                    Showing {filtered.length} {activeStar}-star review
                    {filtered.length === 1 ? "" : "s"}.
                  </p>
                )}
                <div className="mt-5 space-y-6">
                  {filtered.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {writeOpen && (
        <WriteReviewModal
          slug={slug}
          existing={eligibility?.my_review ?? null}
          onClose={() => setWriteOpen(false)}
        />
      )}
      {authPromptOpen && <AuthPromptModal onClose={() => setAuthPromptOpen(false)} />}
    </section>
  );
}
