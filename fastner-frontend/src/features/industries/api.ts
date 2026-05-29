/** Raw industries API calls. React Query hooks in queries.ts wrap these. */
import { apiFetch } from "@/lib/api/client";

import type { Industry, IndustryCreateInput, IndustryUpdateInput } from "./types";

// --- public (storefront) ---

export const getPublicIndustries = () =>
  apiFetch<Industry[]>("/industries", { auth: false });

// --- admin ---

export const getIndustries = () =>
  apiFetch<Industry[]>("/admin/industries");

export const createIndustry = (input: IndustryCreateInput) =>
  apiFetch<Industry>("/admin/industries", { method: "POST", body: input });

export const updateIndustry = (id: string, input: IndustryUpdateInput) =>
  apiFetch<Industry>(`/admin/industries/${id}`, { method: "PUT", body: input });

export const deleteIndustry = (id: string) =>
  apiFetch<void>(`/admin/industries/${id}`, { method: "DELETE" });
