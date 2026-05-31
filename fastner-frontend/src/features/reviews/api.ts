/** Raw review API calls. React Query hooks live in queries.ts. */
import { apiFetch } from "@/lib/api/client";

import type {
  Review,
  ReviewCreateInput,
  ReviewEligibility,
  ReviewListResponse,
} from "./types";

/** Public: a product's reviews + rating summary. */
export const getProductReviews = (slug: string) =>
  apiFetch<ReviewListResponse>(`/reviews/products/${slug}`, { auth: false });

/** Whether the signed-in user has bought this product and may review it. */
export const getReviewEligibility = (slug: string) =>
  apiFetch<ReviewEligibility>(`/reviews/products/${slug}/eligibility`);

/** Create or update the signed-in buyer's review. */
export const submitReview = (slug: string, input: ReviewCreateInput) =>
  apiFetch<Review>(`/reviews/products/${slug}`, {
    method: "POST",
    body: input,
  });
