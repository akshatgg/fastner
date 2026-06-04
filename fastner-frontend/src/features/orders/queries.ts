"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

import {
  approveOrder,
  declineOrder,
  getAdminOrder,
  getAdminOrders,
  getMyOrders,
  getOrder,
  placeOrder,
  setOrderDelivery,
  updateOrderStatus,
} from "./api";
import type {
  ApproveOrderInput,
  DeclineOrderInput,
  PlaceOrderInput,
  SetDeliveryInput,
  UpdateOrderStatusInput,
} from "./types";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export const orderKeys = {
  list: ["orders"] as const,
  detail: (id: string) => ["orders", id] as const,
  adminList: (status: string) => ["admin-orders", status] as const,
  adminDetail: (id: string) => ["admin-orders", "detail", id] as const,
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

// --- admin order desk ---

export function useAdminOrders(status = "") {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: orderKeys.adminList(status),
    queryFn: () => getAdminOrders(status || undefined),
    enabled: Boolean(accessToken),
  });
}

export function useAdminOrder(id: string | null) {
  return useQuery({
    queryKey: orderKeys.adminDetail(id ?? ""),
    queryFn: () => getAdminOrder(id as string),
    enabled: Boolean(id),
  });
}

/** Invalidate every admin-order query after a mutation. */
function useInvalidateAdminOrders() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin-orders"] });
}

export function useApproveOrder() {
  const invalidate = useInvalidateAdminOrders();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ApproveOrderInput }) =>
      approveOrder(id, input),
    onSuccess: () => {
      invalidate();
      toast.success("Order approved — the customer has been notified.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not approve the order.")),
  });
}

export function useDeclineOrder() {
  const invalidate = useInvalidateAdminOrders();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DeclineOrderInput }) =>
      declineOrder(id, input),
    onSuccess: () => {
      invalidate();
      toast.success("Order declined — refund initiated and customer notified.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not decline the order.")),
  });
}

export function useUpdateOrderStatus() {
  const invalidate = useInvalidateAdminOrders();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOrderStatusInput }) =>
      updateOrderStatus(id, input),
    onSuccess: () => {
      invalidate();
      toast.success("Order updated.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not update the order.")),
  });
}

export function useSetOrderDelivery() {
  const invalidate = useInvalidateAdminOrders();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SetDeliveryInput }) =>
      setOrderDelivery(id, input),
    onSuccess: () => {
      invalidate();
      toast.success("Delivery date saved.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not save the delivery date.")),
  });
}
