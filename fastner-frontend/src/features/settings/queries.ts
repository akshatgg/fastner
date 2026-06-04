"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

import { getGstSetting, getPublicSettings, updateGstSetting } from "./api";

export const settingsKeys = {
  public: ["settings", "public"] as const,
  gst: ["settings", "gst"] as const,
};

/** Public GST rate (%), for the cart/checkout tax line. Rarely changes. */
export function usePublicSettings() {
  return useQuery({
    queryKey: settingsKeys.public,
    queryFn: getPublicSettings,
    staleTime: 5 * 60_000,
  });
}

export function useGstSetting() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: settingsKeys.gst,
    queryFn: getGstSetting,
    enabled: Boolean(accessToken),
  });
}

export function useUpdateGst() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gst_rate: number) => updateGstSetting(gst_rate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.gst });
      qc.invalidateQueries({ queryKey: settingsKeys.public });
      toast.success("GST rate updated.");
    },
    onError: (e) =>
      toast.error(
        e instanceof ApiError ? e.message : "Could not update the GST rate.",
      ),
  });
}
