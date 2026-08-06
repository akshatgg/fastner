"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";

import FilterBar from "./FilterBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import ModeToggle from "@/components/ui/ModeToggle";
import {
  useCategoryProducts,
  usePublicCategoryTree,
} from "@/features/catalog/queries";
import {
  useAddToCart,
  useCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/features/cart/queries";
import { findWithTrail } from "@/features/catalog/tree";
import type { CategoryTreeNode, Product, ProductSort } from "@/features/catalog/types";
import { formatPrice } from "@/lib/format";
import { useModeStore } from "@/lib/store/mode-store";

export default function CategoryView({ id }: { id: string }) {
  const { data: tree, isLoading } = usePublicCategoryTree();

  const found = tree ? findWithTrail(tree, id) : null;
  const node = found?.node;
  const isLeaf = node ? node.children.length === 0 : false;

  return (
    <>
      <Header />
      <main className="flex-1 bg-ink-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
            <Link href="/#categories" className="hover:text-brand-600">
              Categories
            </Link>
            {found?.trail.map((c) => (
              <span key={c.id} className="flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 text-ink-300" />
                {c.id === id ? (
                  <span className="font-semibold text-ink-900">{c.name}</span>
                ) : (
                  <Link href={`/category/${c.id}`} className="hover:text-brand-600">
                    {c.name}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          {isLoading ? (
            <p className="py-20 text-center text-sm text-ink-400">Loading…</p>
          ) : !node ? (
            <div className="py-20 text-center">
              <p className="text-lg font-semibold text-ink-900">Category not found.</p>
              <Link href="/#categories" className="mt-2 inline-block text-brand-600">
                Back to categories
              </Link>
            </div>
          ) : (
            <div className="mt-6">
              <SectionHeading
                eyebrow={isLeaf ? "Products" : "Browse"}
                title={node.name}
                description={node.description ?? undefined}
                align="left"
              />
              {isLeaf ? (
                <LeafProducts category={node} />
              ) : (
                <SubcategoryGrid node={node} />
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function SubcategoryGrid({ node }: { node: CategoryTreeNode }) {
  return (
    <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {node.children.map((child) => (
        <Link
          key={child.id}
          href={`/category/${child.id}`}
          className="group flex flex-col items-center rounded-xl border border-ink-100 bg-white p-4 text-center shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
        >
          <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-ink-50">
            {child.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={child.image_url}
                alt={child.name}
                className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <span className="font-display text-4xl font-bold text-ink-200">
                {child.name.trim().charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h3 className="mt-3 font-display text-sm font-bold uppercase tracking-wide text-ink-900 sm:text-base">
            {child.name}
          </h3>
          {child.children.length > 0 && (
            <span className="mt-1 text-xs text-ink-400">
              {child.children.length} subcategor
              {child.children.length === 1 ? "y" : "ies"}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

function LeafProducts({ category }: { category: CategoryTreeNode }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [sort, setSort] = useState<ProductSort>("featured");
  // Price sorts follow the active buying mode so the order matches the prices
  // shown on the cards (B2C retail vs B2B bulk).
  const mode = useModeStore((s) => s.mode);
  const { data, isLoading } = useCategoryProducts(category.id, selected, 1, sort, mode);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="mt-8">
      {/* Pricing mode — applies to every product in the list */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card">
        <span className="text-sm font-semibold text-ink-700">Buying as</span>
        <ModeToggle />
        <span className="text-xs text-ink-400">
          B2B shows bulk rates — minimum order quantities apply.
        </span>
      </div>

      {/* Filters run the full width above the results, so the grid below gets
          the whole page and every spec group is visible at once. */}
      <FilterBar
        facets={data?.facets ?? []}
        selected={selected}
        onToggle={toggle}
        onClear={() => setSelected([])}
      />

      <div className="mt-8">
        <ProductGrid
          isLoading={isLoading}
          items={data?.items ?? []}
          total={data?.total ?? 0}
          hasFilters={selected.length > 0}
          sort={sort}
          onSortChange={setSort}
        />
      </div>
    </div>
  );
}

function ProductGrid({
  isLoading,
  items,
  total,
  hasFilters,
  sort,
  onSortChange,
}: {
  isLoading: boolean;
  items: Product[];
  total: number;
  hasFilters: boolean;
  sort: ProductSort;
  onSortChange: (s: ProductSort) => void;
}) {
  return (
    <div className="flex-1">
      {/* Toolbar: result count + sort. Kept mounted while products exist so the
          control stays put during a re-sort (results are held via keepPreviousData). */}
      {!isLoading && items.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-ink-500">{total} products</p>
          <SortSelect value={sort} onChange={onSortChange} />
        </div>
      )}
      {isLoading ? (
        <p className="py-20 text-center text-sm text-ink-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-200 py-20 text-center text-sm text-ink-400">
          No products {hasFilters ? "match these filters" : "in this category yet"}.
        </p>
      ) : (
        // Now the filters sit above rather than beside, the grid has the full
        // page width — so it steps up to five across on wide screens.
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

/** "Sort by" control shown beside the filters. A styled native <select> so it
 *  stays keyboard- and mobile-friendly. */
function SortSelect({
  value,
  onChange,
}: {
  value: ProductSort;
  onChange: (s: ProductSort) => void;
}) {
  return (
    <div className="relative shrink-0">
      <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <select
        aria-label="Sort products"
        value={value}
        onChange={(e) => onChange(e.target.value as ProductSort)}
        className="appearance-none rounded-lg border border-ink-200 bg-white py-2 pl-8 pr-9 text-sm font-medium text-ink-800 shadow-card outline-none transition hover:border-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const addToCart = useAddToCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const { data: cart } = useCart();
  const mode = useModeStore((s) => s.mode);

  const price = mode === "b2b" ? product.price_b2b : product.price_b2c;
  const isB2b = mode === "b2b";
  const minQty = isB2b ? product.b2b_min_qty : 1;

  // Live quantity already in the cart for this product (0 = not added yet).
  const inCart = cart?.items.find((i) => i.product_id === product.id)?.quantity ?? 0;
  const busy = addToCart.isPending || updateItem.isPending || removeItem.isPending;

  const setQty = (next: number) => {
    if (next <= 0) removeItem.mutate(product.id);
    else updateItem.mutate({ productId: product.id, quantity: next });
  };

  return (
    <div className="group flex flex-col rounded-xl border border-ink-100 bg-white p-3 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift">
      <Link href={`/product/${product.slug}`} className="flex flex-col">
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-ink-50">
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.name}
              className={`h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105 ${
                product.is_out_of_stock ? "opacity-50" : ""
              }`}
              loading="lazy"
            />
          ) : (
            <span className="font-display text-3xl font-bold text-ink-200">
              {product.name.trim().charAt(0).toUpperCase()}
            </span>
          )}
          {product.is_out_of_stock && (
            <span className="absolute left-2 top-2 rounded bg-ink-900/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Out of stock
            </span>
          )}
        </div>
        <h3 className="mt-2 text-sm font-semibold text-ink-900 line-clamp-2">
          {product.name}
        </h3>
      </Link>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-base font-bold text-ink-900">{formatPrice(price)}</span>
        {price != null && <span className="text-xs text-ink-400">/ pc</span>}
      </div>
      {isB2b && product.b2b_min_qty > 1 && (
        <p className="text-xs font-medium text-brand-600">
          min {product.b2b_min_qty} pcs
        </p>
      )}

      {product.is_out_of_stock ? (
        <span className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-xs font-bold text-ink-400">
          Out of stock
        </span>
      ) : inCart > 0 ? (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50">
          <button
            type="button"
            onClick={() => setQty(inCart - 1)}
            disabled={busy}
            className="flex h-9 w-9 items-center justify-center rounded-l-lg text-brand-700 transition hover:bg-brand-100 disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-brand-700">{inCart}</span>
          <button
            type="button"
            onClick={() => setQty(inCart + 1)}
            disabled={busy}
            className="flex h-9 w-9 items-center justify-center rounded-r-lg text-brand-700 transition hover:bg-brand-100 disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() =>
            addToCart.mutate({ product_id: product.id, quantity: minQty })
          }
          disabled={busy}
          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-bold text-ink-700 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-50"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Add to cart
        </button>
      )}
    </div>
  );
}
