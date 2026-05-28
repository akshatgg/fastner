"use client";

import Link from "next/link";
import { use, useState } from "react";
import { ChevronRight } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import {
  useCategoryProducts,
  usePublicCategoryTree,
} from "@/features/catalog/queries";
import { findWithTrail } from "@/features/catalog/tree";
import type { CategoryTreeNode } from "@/features/catalog/types";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
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
  const { data, isLoading } = useCategoryProducts(category.id, selected, 1);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="mt-10 flex flex-col gap-8 lg:flex-row">
      {/* Filter sidebar */}
      {data && data.facets.length > 0 && (
        <aside className="w-full shrink-0 lg:w-64">
          <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
            <p className="font-display text-sm font-bold uppercase text-ink-900">Filters</p>
            {data.facets.map((facet) => (
              <div key={facet.group_id} className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {facet.group_name}
                </p>
                <div className="mt-2 space-y-1.5">
                  {facet.values.map((v) => (
                    <label key={v.id} className="flex items-center gap-2 text-sm text-ink-700">
                      <input
                        type="checkbox"
                        checked={selected.includes(v.id)}
                        onChange={() => toggle(v.id)}
                      />
                      {v.value}
                      <span className="ml-auto text-xs text-ink-400">{v.count}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {selected.length > 0 && (
              <button
                onClick={() => setSelected([])}
                className="mt-4 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Clear all
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Product grid */}
      <div className="flex-1">
        {isLoading ? (
          <p className="py-20 text-center text-sm text-ink-400">Loading…</p>
        ) : !data || data.items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink-200 py-20 text-center text-sm text-ink-400">
            No products {selected.length > 0 ? "match these filters" : "in this category yet"}.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-ink-500">{data.total} products</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {data.items.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  className="group flex flex-col rounded-xl border border-ink-100 bg-white p-3 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
                >
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-ink-50">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <span className="font-display text-3xl font-bold text-ink-200">
                        {p.name.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-ink-900 line-clamp-2">
                    {p.name}
                  </h3>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
