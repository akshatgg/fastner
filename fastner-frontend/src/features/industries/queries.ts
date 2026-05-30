"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

import {
  createIndustry,
  deleteIndustry,
  getIndustries,
  getPublicIndustries,
  reorderIndustries,
  updateIndustry,
} from "./api";
import type { IndustryCreateInput, IndustryUpdateInput } from "./types";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export const industryKeys = {
  list: ["industries", "list"] as const,
  publicList: ["industries", "public-list"] as const,
};

/** Public storefront industries (active only, no auth). */
export function usePublicIndustries() {
  return useQuery({
    queryKey: industryKeys.publicList,
    queryFn: getPublicIndustries,
  });
}

/** Admin list (all industries, including hidden). */
export function useIndustries() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: industryKeys.list,
    queryFn: getIndustries,
    enabled: Boolean(accessToken),
  });
}

export function useCreateIndustry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: IndustryCreateInput) => createIndustry(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: industryKeys.list });
      qc.invalidateQueries({ queryKey: industryKeys.publicList });
      toast.success("Industry added.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not add the industry.")),
  });
}

export function useUpdateIndustry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: IndustryUpdateInput }) =>
      updateIndustry(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: industryKeys.list });
      qc.invalidateQueries({ queryKey: industryKeys.publicList });
      toast.success("Industry updated.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not update the industry.")),
  });
}

export function useDeleteIndustry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIndustry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: industryKeys.list });
      qc.invalidateQueries({ queryKey: industryKeys.publicList });
      toast.success("Industry deleted.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not delete the industry.")),
  });
}

/** Persist a drag-and-drop industry order. Reordered optimistically in the UI;
 *  we only resync (and revert on failure) once the call settles. */
export function useReorderIndustries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (industryIds: string[]) => reorderIndustries(industryIds),
    onError: (e) => toast.error(errorMessage(e, "Could not save the new order.")),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: industryKeys.list });
      qc.invalidateQueries({ queryKey: industryKeys.publicList });
    },
  });
}
