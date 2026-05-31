"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

import {
  getProductReviews,
  getReviewEligibility,
  submitReview,
} from "./api";
import type { ReviewCreateInput } from "./types";

export const reviewKeys = {
  list: (slug: string) => ["reviews", slug] as const,
  eligibility: (slug: string) => ["reviews", slug, "eligibility"] as const,
};

/** A product's reviews + rating summary (public). */
export function useProductReviews(slug: string | null) {
  return useQuery({
    queryKey: reviewKeys.list(slug ?? ""),
    queryFn: () => getProductReviews(slug as string),
    enabled: Boolean(slug),
  });
}

/** Whether the signed-in user can review this product. Only runs when authed. */
export function useReviewEligibility(slug: string | null) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: reviewKeys.eligibility(slug ?? ""),
    queryFn: () => getReviewEligibility(slug as string),
    enabled: Boolean(slug) && Boolean(accessToken),
  });
}

/** Submit (or update) the buyer's review for a product. */
export function useSubmitReview(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewCreateInput) => submitReview(slug, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.list(slug) });
      qc.invalidateQueries({ queryKey: reviewKeys.eligibility(slug) });
      toast.success("Thanks for your review!");
    },
    onError: (e) =>
      toast.error(
        e instanceof ApiError ? e.message : "Could not submit your review.",
      ),
  });
}
