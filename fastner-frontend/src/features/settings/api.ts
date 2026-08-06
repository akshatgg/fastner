/** Store-settings API calls (GST rate, homepage stats bar). */
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

// --- Homepage stats bar ----------------------------------------------------

/** A resolved figure for the storefront "By the numbers" bar. `value` is the
 *  number to display — the live DB count, or the admin override when set. */
export type HomepageStat = {
  key: string;
  label: string;
  value: number;
  suffix: string;
};

/** A stat as the admin edits it — carries the current override (`manual_value`,
 *  `null` = live) alongside the `live_value` computed right now. */
export type AdminHomepageStat = {
  key: string;
  label: string;
  manual_value: number | null;
  live_value: number;
  suffix: string;
  position: number;
  is_active: boolean;
};

/** The editable fields sent back when saving a stat. */
export type HomepageStatUpdate = {
  key: string;
  label: string;
  manual_value: number | null;
  suffix: string;
  is_active: boolean;
};

/** Public — resolved figures for the homepage bar (no auth). */
export const getHomepageStats = () =>
  apiFetch<HomepageStat[]>("/settings/homepage-stats", { auth: false });

/** Admin — read the stats config (with live values) + save edits. */
export const getAdminHomepageStats = () =>
  apiFetch<AdminHomepageStat[]>("/admin/settings/homepage-stats");

export const updateHomepageStats = (stats: HomepageStatUpdate[]) =>
  apiFetch<AdminHomepageStat[]>("/admin/settings/homepage-stats", {
    method: "PUT",
    body: { stats },
  });
