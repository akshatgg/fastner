/** Raw order API calls. React Query hooks live in queries.ts. */
import { apiFetch } from "@/lib/api/client";

import type {
  AdminOrder,
  ApproveOrderInput,
  DeclineOrderInput,
  Order,
  PlaceOrderInput,
  SetDeliveryInput,
  UpdateOrderStatusInput,
} from "./types";

/** Place an order from the current cart. When Razorpay fields are included the
 *  backend verifies the payment and marks the order paid; otherwise it's a
 *  plain placed order. Either way the cart is emptied server-side. */
export const placeOrder = (input: PlaceOrderInput) =>
  apiFetch<Order>("/orders", { method: "POST", body: input });

export const getMyOrders = () => apiFetch<Order[]>("/orders");

export const getOrder = (id: string) => apiFetch<Order>(`/orders/${id}`);

// --- admin order desk ---

export const getAdminOrders = (status?: string) =>
  apiFetch<AdminOrder[]>(
    `/admin/orders${status ? `?status=${encodeURIComponent(status)}` : ""}`,
  );

export const getAdminOrder = (id: string) =>
  apiFetch<AdminOrder>(`/admin/orders/${id}`);

export const approveOrder = (id: string, input: ApproveOrderInput) =>
  apiFetch<AdminOrder>(`/admin/orders/${id}/approve`, {
    method: "POST",
    body: input,
  });

export const declineOrder = (id: string, input: DeclineOrderInput) =>
  apiFetch<AdminOrder>(`/admin/orders/${id}/decline`, {
    method: "POST",
    body: input,
  });

export const updateOrderStatus = (id: string, input: UpdateOrderStatusInput) =>
  apiFetch<AdminOrder>(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: input,
  });

export const setOrderDelivery = (id: string, input: SetDeliveryInput) =>
  apiFetch<AdminOrder>(`/admin/orders/${id}/delivery`, {
    method: "PATCH",
    body: input,
  });
