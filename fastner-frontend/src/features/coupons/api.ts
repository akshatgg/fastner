/** Raw coupon API calls. React Query hooks live in queries.ts. */
import { apiFetch } from "@/lib/api/client";

import type { Coupon, CouponInput, CouponPreview } from "./types";

/** Validate a code against the signed-in user's current cart. */
export const validateCoupon = (code: string) =>
  apiFetch<CouponPreview>("/coupons/validate", {
    method: "POST",
    body: { code },
  });

// --- admin ---

export const getCoupons = () => apiFetch<Coupon[]>("/admin/coupons");

export const createCoupon = (input: CouponInput) =>
  apiFetch<Coupon>("/admin/coupons", { method: "POST", body: input });

export const updateCoupon = (id: string, input: Partial<CouponInput>) =>
  apiFetch<Coupon>(`/admin/coupons/${id}`, { method: "PUT", body: input });

export const deleteCoupon = (id: string) =>
  apiFetch<void>(`/admin/coupons/${id}`, { method: "DELETE" });
