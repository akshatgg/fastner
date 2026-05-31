"use client";

import { useQuery } from "@tanstack/react-query";

import { getPaymentConfig } from "./api";

/** Whether the storefront should run the Razorpay flow at checkout. Rarely
 *  changes within a session, so it's cached aggressively. */
export function usePaymentConfig() {
  return useQuery({
    queryKey: ["payment-config"],
    queryFn: getPaymentConfig,
    staleTime: Infinity,
  });
}
