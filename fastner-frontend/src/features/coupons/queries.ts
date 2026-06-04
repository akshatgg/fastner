"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

import {
  createCoupon,
  deleteCoupon,
  getCoupons,
  updateCoupon,
  validateCoupon,
} from "./api";
import type { CouponInput } from "./types";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export const couponKeys = {
  adminList: ["admin-coupons"] as const,
};

/** Validate a coupon against the current cart (used on checkout). */
export function useValidateCoupon() {
  return useMutation({
    mutationFn: (code: string) => validateCoupon(code),
  });
}

// --- admin ---

export function useAdminCoupons() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: couponKeys.adminList,
    queryFn: getCoupons,
    enabled: Boolean(accessToken),
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CouponInput) => createCoupon(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: couponKeys.adminList });
      toast.success("Coupon created.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not create the coupon.")),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CouponInput> }) =>
      updateCoupon(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: couponKeys.adminList });
      toast.success("Coupon updated.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not update the coupon.")),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: couponKeys.adminList });
      toast.success("Coupon deleted.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not delete the coupon.")),
  });
}
