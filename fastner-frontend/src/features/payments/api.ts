/** Raw payment API calls (Razorpay). React Query hooks live in queries.ts. */
import { apiFetch } from "@/lib/api/client";

import type {
  PaymentConfig,
  RazorpayCallbackResponse,
  RazorpayOrder,
} from "./types";

/** Public: whether online payment is configured + the publishable key id. */
export const getPaymentConfig = () =>
  apiFetch<PaymentConfig>("/payments/config", { auth: false });

/** Create a Razorpay order for the signed-in user's current cart total. */
export const createRazorpayOrder = () =>
  apiFetch<RazorpayOrder>("/payments/razorpay/order", { method: "POST" });

/** Verify the Checkout callback signature after a successful payment. */
export const verifyRazorpayPayment = (input: RazorpayCallbackResponse) =>
  apiFetch<{ verified: boolean }>("/payments/razorpay/verify", {
    method: "POST",
    body: input,
  });
