"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/lib/store/auth-store";

import { getMyOrders, getOrder, placeOrder } from "./api";
import type { PlaceOrderInput } from "./types";

export const orderKeys = {
  list: ["orders"] as const,
  detail: (id: string) => ["orders", id] as const,
};

/** Place an order from the cart. Empties the cart and refreshes order lists. */
export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceOrderInput) => placeOrder(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: orderKeys.list });
      // Eligibility may now have flipped to "can review" for these products.
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

/** The signed-in user's orders, newest first. */
export function useMyOrders() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: orderKeys.list,
    queryFn: getMyOrders,
    enabled: Boolean(accessToken),
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ""),
    queryFn: () => getOrder(id as string),
    enabled: Boolean(id),
  });
}
