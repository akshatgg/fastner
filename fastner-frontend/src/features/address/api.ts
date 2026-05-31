/** Raw address-book API calls. React Query hooks in queries.ts wrap these.
 *  All require auth — the address book is scoped to the signed-in user. */
import { apiFetch } from "@/lib/api/client";

import type { Address, AddressInput } from "./types";

export const getAddresses = () => apiFetch<Address[]>("/addresses");

export const createAddress = (input: AddressInput) =>
  apiFetch<Address>("/addresses", { method: "POST", body: input });

export const updateAddress = (id: string, input: AddressInput) =>
  apiFetch<Address>(`/addresses/${id}`, { method: "PUT", body: input });

export const setDefaultAddress = (id: string) =>
  apiFetch<Address>(`/addresses/${id}/default`, { method: "PUT" });

export const deleteAddress = (id: string) =>
  apiFetch<void>(`/addresses/${id}`, { method: "DELETE" });
