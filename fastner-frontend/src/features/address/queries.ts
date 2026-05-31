"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from "./api";
import type { AddressInput } from "./types";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export const addressKeys = {
  all: ["addresses"] as const,
};

/** The signed-in user's saved addresses. Only fetched when authenticated. */
export function useAddresses() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: addressKeys.all,
    queryFn: getAddresses,
    enabled: Boolean(accessToken),
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddressInput) => createAddress(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: addressKeys.all });
      toast.success("Address saved.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not save the address.")),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AddressInput }) =>
      updateAddress(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: addressKeys.all });
      toast.success("Address updated.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not update the address.")),
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setDefaultAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
    onError: (e) =>
      toast.error(errorMessage(e, "Could not set the default address.")),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: addressKeys.all });
      toast.success("Address removed.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not remove the address.")),
  });
}
