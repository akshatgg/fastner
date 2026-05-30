/** Raw cart API calls. React Query hooks in queries.ts wrap these. All require
 *  auth — the cart is scoped to the signed-in user. */
import { apiFetch } from "@/lib/api/client";
import type { Mode } from "@/lib/store/mode-store";

import type { AddToCartInput, Cart } from "./types";

export const getCart = () => apiFetch<Cart>("/cart");

export const addToCart = (input: AddToCartInput) =>
  apiFetch<Cart>("/cart/items", { method: "POST", body: input });

export const setCartMode = (mode: Mode) =>
  apiFetch<Cart>("/cart/mode", { method: "PUT", body: { mode } });

export const updateCartItem = (productId: string, quantity: number) =>
  apiFetch<Cart>(`/cart/items/${productId}`, {
    method: "PUT",
    body: { quantity },
  });

export const removeCartItem = (productId: string) =>
  apiFetch<Cart>(`/cart/items/${productId}`, { method: "DELETE" });

export const clearCart = () => apiFetch<Cart>("/cart", { method: "DELETE" });
