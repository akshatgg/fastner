"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

import {
  createCategory,
  createFilterGroup,
  createFilterValue,
  createProduct,
  deleteCategory,
  deleteFilterGroup,
  deleteFilterValue,
  deleteProduct,
  getCategoryProducts,
  getCategoryTree,
  getFilterGroups,
  getProduct,
  getPublicCategoryTree,
  getPublicProduct,
  updateCategory,
  updateProduct,
} from "./api";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
  ProductCreateInput,
  ProductUpdateInput,
} from "./types";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export const catalogKeys = {
  categoryTree: ["catalog", "category-tree"] as const,
  publicTree: ["catalog", "public-tree"] as const,
  filterGroups: ["catalog", "filter-groups"] as const,
  product: (id: string) => ["catalog", "product", id] as const,
  categoryProducts: (id: string, filters: string[], page: number) =>
    ["catalog", "category-products", id, filters, page] as const,
  publicProduct: (slug: string) => ["catalog", "public-product", slug] as const,
};

/** Public storefront category tree (active categories only, no auth). */
export function usePublicCategoryTree() {
  return useQuery({
    queryKey: catalogKeys.publicTree,
    queryFn: getPublicCategoryTree,
  });
}

/** Rolled-up products under a category, plus filter facets. */
export function useCategoryProducts(
  categoryId: string | null,
  filterValueIds: string[],
  page: number,
) {
  return useQuery({
    queryKey: catalogKeys.categoryProducts(categoryId ?? "", filterValueIds, page),
    queryFn: () =>
      getCategoryProducts(categoryId as string, { filterValueIds, page, pageSize: 24 }),
    enabled: Boolean(categoryId),
  });
}

/** Public product detail by slug. */
export function usePublicProduct(slug: string | null) {
  return useQuery({
    queryKey: catalogKeys.publicProduct(slug ?? ""),
    queryFn: () => getPublicProduct(slug as string),
    enabled: Boolean(slug),
  });
}

const ADMIN_ROLES = ["admin", "superadmin"];

/** Guard for admin-only pages: bounce anyone who isn't an admin. */
export function useRequireAdmin(to = "/sign-in") {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const allowed = Boolean(accessToken) && Boolean(user && ADMIN_ROLES.includes(user.role));

  useEffect(() => {
    if (allowed) return;
    // Wait until the user profile has loaded before deciding to redirect.
    if (accessToken && !user) return;
    const id = setTimeout(() => router.replace(accessToken ? "/" : to), 0);
    return () => clearTimeout(id);
  }, [allowed, accessToken, user, router, to]);

  return allowed;
}

// --- categories ---

export function useCategoryTree() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: catalogKeys.categoryTree,
    queryFn: getCategoryTree,
    enabled: Boolean(accessToken),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryCreateInput) => createCategory(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogKeys.categoryTree });
      toast.success("Category added.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not add the category.")),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryUpdateInput }) =>
      updateCategory(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogKeys.categoryTree });
      toast.success("Category updated.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not update the category.")),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogKeys.categoryTree });
      toast.success("Category deleted.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not delete the category.")),
  });
}

// --- filters ---

export function useFilterGroups() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: catalogKeys.filterGroups,
    queryFn: getFilterGroups,
    enabled: Boolean(accessToken),
  });
}

export function useCreateFilterGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; unit?: string | null }) =>
      createFilterGroup(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogKeys.filterGroups });
      toast.success("Filter group added.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not add the filter group.")),
  });
}

export function useDeleteFilterGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFilterGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogKeys.filterGroups });
      toast.success("Filter group deleted.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not delete the filter group.")),
  });
}

export function useCreateFilterValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { filter_group_id: string; value: string }) =>
      createFilterValue(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogKeys.filterGroups });
      toast.success("Filter value added.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not add the value.")),
  });
}

export function useDeleteFilterValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFilterValue(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogKeys.filterGroups });
      toast.success("Value deleted.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not delete the value.")),
  });
}

// --- products ---

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: catalogKeys.product(id ?? ""),
    queryFn: () => getProduct(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductCreateInput) => createProduct(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogKeys.categoryTree });
      toast.success("Product added.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not add the product.")),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductUpdateInput }) =>
      updateProduct(id, input),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: catalogKeys.product(p.id) });
      toast.success("Product updated.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not update the product.")),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => toast.success("Product deleted."),
    onError: (e) => toast.error(errorMessage(e, "Could not delete the product.")),
  });
}
