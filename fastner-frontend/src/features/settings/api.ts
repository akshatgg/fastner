/** Store-settings API calls (GST rate). */
import { apiFetch } from "@/lib/api/client";

export type GstSetting = { gst_rate: number };

/** Public — used to show the GST line on the cart/checkout (no auth). */
export const getPublicSettings = () =>
  apiFetch<GstSetting>("/settings/public", { auth: false });

/** Admin — read + update the GST rate. */
export const getGstSetting = () =>
  apiFetch<GstSetting>("/admin/settings/gst");

export const updateGstSetting = (gst_rate: number) =>
  apiFetch<GstSetting>("/admin/settings/gst", {
    method: "PUT",
    body: { gst_rate },
  });
