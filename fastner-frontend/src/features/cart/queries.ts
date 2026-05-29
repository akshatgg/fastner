"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "./api";
import type { AddToCartInput, Cart } from "./types";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export const cartKeys = {
  cart: ["cart"] as const,
};

/** The signed-in user's cart. Only fetched when authenticated. */
export function useCart() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: cartKeys.cart,
    queryFn: getCart,
    enabled: Boolean(accessToken),
  });
}

/** Live item count for the header badge (0 when signed out). */
export function useCartCount() {
  const { data } = useCart();
  return data?.total_quantity ?? 0;
}

/** Add a product to the cart. Anonymous visitors are sent to sign-in first. */
export function useAddToCart() {
  const qc = useQueryClient();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation({
    mutationFn: (input: AddToCartInput) => addToCart(input),
    onMutate: () => {
      if (!accessToken) {
        // Bounce to sign-in instead of firing an unauthenticated request.
        toast.message("Please sign in to add items to your cart.");
        router.push("/sign-in?next=/cart");
        throw new Error("not-authenticated");
      }
    },
    onSuccess: (cart) => {
      qc.setQueryData(cartKeys.cart, cart);
      toast.success("Added to cart.");
    },
    onError: (e) => {
      if (e instanceof Error && e.message === "not-authenticated") return;
      toast.error(errorMessage(e, "Could not add to cart."));
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      updateCartItem(productId, quantity),
    onSuccess: (cart) => qc.setQueryData(cartKeys.cart, cart),
    onError: (e) => toast.error(errorMessage(e, "Could not update the item.")),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => removeCartItem(productId),
    onSuccess: (cart) => {
      qc.setQueryData(cartKeys.cart, cart);
      toast.success("Removed from cart.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not remove the item.")),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clearCart(),
    onSuccess: (cart: Cart) => {
      qc.setQueryData(cartKeys.cart, cart);
      toast.success("Cart cleared.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not clear the cart.")),
  });
}
