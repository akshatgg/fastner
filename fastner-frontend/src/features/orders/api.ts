/** Raw order API calls. React Query hooks live in queries.ts. */
import { apiFetch } from "@/lib/api/client";

import type { Order, PlaceOrderInput } from "./types";

/** Place an order from the current cart. When Razorpay fields are included the
 *  backend verifies the payment and marks the order paid; otherwise it's a
 *  plain placed order. Either way the cart is emptied server-side. */
export const placeOrder = (input: PlaceOrderInput) =>
  apiFetch<Order>("/orders", { method: "POST", body: input });

export const getMyOrders = () => apiFetch<Order[]>("/orders");

export const getOrder = (id: string) => apiFetch<Order>(`/orders/${id}`);
