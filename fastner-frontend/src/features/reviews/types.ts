/** Types mirroring the backend `app/reviews/schemas.py` contracts. */

export type ReviewMediaType = "image" | "video";

export type ReviewMedia = {
  url: string;
  type: ReviewMediaType;
};

export type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  media: ReviewMedia[];
  author_name: string;
  verified_purchase: boolean;
  created_at: string;
};

export type RatingSummary = {
  average: number;
  count: number;
  /** Counts keyed by star value "1".."5". */
  distribution: Record<string, number>;
  /** Percentages (0–100) keyed by star value "1".."5". */
  distribution_pct: Record<string, number>;
};

export type ReviewListResponse = {
  summary: RatingSummary;
  items: Review[];
};

export type ReviewEligibility = {
  can_review: boolean;
  already_reviewed: boolean;
  verified_purchase: boolean;
  my_review: Review | null;
};

export type ReviewCreateInput = {
  rating: number;
  title?: string | null;
  body?: string | null;
  media?: ReviewMedia[];
};
