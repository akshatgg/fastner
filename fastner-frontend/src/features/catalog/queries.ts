"use client";

import { useEffect } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
  getAdminCategoryProducts,
  getCategoryProducts,
  getCategoryTree,
  getFilterGroups,
  getProduct,
  getPublicCategoryTree,
  getPublicProduct,
  getRelatedProducts,
  reorderProducts,
  searchCatalog,
  updateCategory,
  updateProduct,
} from "./api";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
  ProductCreateInput,
  ProductSort,
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
  categoryProducts: (
    id: string,
    filters: string[],
    page: number,
    sort: string,
    priceMode: string,
  ) =>
    ["catalog", "category-products", id, filters, page, sort, priceMode] as const,
  adminCategoryProducts: (id: string) =>
    ["catalog", "admin-category-products", id] as const,
  publicProduct: (slug: string) => ["catalog", "public-product", slug] as const,
  related: (slug: string, limit: number) =>
    ["catalog", "related", slug, limit] as const,
  search: (q: string, limit: number) => ["catalog", "search", q, limit] as const,
};

/** Public storefront category tree (active categories only, no auth). Pass a
 *  `range` to limit it to one storefront range; omit it for the full tree. */
export function usePublicCategoryTree(range?: "industrial" | "diy") {
  return useQuery({
    queryKey: [...catalogKeys.publicTree, range ?? "all"],
    queryFn: () => getPublicCategoryTree(range),
  });
}

/** Rolled-up products under a category, plus filter facets. `sort` controls the
 *  order; price sorts use the active buying mode's price column (`priceMode`).
 *  Previous results are kept while a re-sort/refilter is in flight to avoid a
 *  flash of the empty/loading state. */
export function useCategoryProducts(
  categoryId: string | null,
  filterValueIds: string[],
  page: number,
  sort: ProductSort = "featured",
  priceMode: "b2c" | "b2b" = "b2c",
) {
  return useQuery({
    queryKey: catalogKeys.categoryProducts(
      categoryId ?? "",
      filterValueIds,
      page,
      sort,
      priceMode,
    ),
    queryFn: () =>
      getCategoryProducts(categoryId as string, {
        filterValueIds,
        page,
        pageSize: 24,
        sort,
        priceMode,
      }),
    enabled: Boolean(categoryId),
    placeholderData: keepPreviousData,
  });
}

/** Admin: all products under a category (incl. inactive) for the tree view. */
export function useAdminCategoryProducts(categoryId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: catalogKeys.adminCategoryProducts(categoryId),
    queryFn: () => getAdminCategoryProducts(categoryId),
    enabled: Boolean(accessToken) && Boolean(categoryId),
  });
}

/** "You may also like" — products related to the given slug (same category). */
export function useRelatedProducts(slug: string | null, limit = 8) {
  return useQuery({
    queryKey: catalogKeys.related(slug ?? "", limit),
    queryFn: () => getRelatedProducts(slug as string, limit),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}

/** Type-ahead storefront search. Only fires once `query` has 2+ characters;
 *  previous results are kept on screen while the next request is in flight so
 *  the dropdown doesn't flicker between keystrokes. Debounce upstream. */
export function useSearchCatalog(query: string, limit = 5) {
  const q = query.trim();
  return useQuery({
    queryKey: catalogKeys.search(q, limit),
    queryFn: () => searchCatalog(q, limit),
    enabled: q.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
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
      qc.invalidateQueries({ queryKey: ["catalog", "admin-category-products"] });
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
      qc.invalidateQueries({ queryKey: ["catalog", "admin-category-products"] });
      toast.success("Product updated.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not update the product.")),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "admin-category-products"] });
      toast.success("Product deleted.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not delete the product.")),
  });
}

/** Persist a drag-and-drop product order. The list is reordered optimistically
 *  in the UI; we only resync (and revert on failure) once the call settles. */
export function useReorderProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productIds: string[]) => reorderProducts(productIds),
    onError: (e) => toast.error(errorMessage(e, "Could not save the new order.")),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["catalog", "admin-category-products"] }),
  });
}
