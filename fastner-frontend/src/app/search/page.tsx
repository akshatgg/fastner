"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import { useSearchCatalog } from "@/features/catalog/queries";
import { formatPrice } from "@/lib/format";
import type { ProductSearchItem } from "@/features/catalog/types";

function SearchResults() {
  const query = (useSearchParams().get("q") ?? "").trim();
  const { data, isFetching } = useSearchCatalog(query, 20);

  const products = data?.products ?? [];
  const empty = query.length >= 2 && !isFetching && products.length === 0;

  return (
    <>
      <Header />
      <main className="flex-1 bg-ink-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Search"
            title={query ? `Results for “${query}”` : "Search"}
            align="left"
          />

          {query.length < 2 ? (
            <p className="mt-10 text-sm text-ink-400">
              Type at least two characters to search.
            </p>
          ) : isFetching && products.length === 0 ? (
            <p className="py-20 text-center text-sm text-ink-400">Searching…</p>
          ) : empty ? (
            <p className="mt-10 rounded-2xl border border-dashed border-ink-200 py-20 text-center text-sm text-ink-400">
              No products match “{query}”.
            </p>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function ProductCard({ product }: { product: ProductSearchItem }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col rounded-xl border border-ink-100 bg-white p-3 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
    >
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-ink-50">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <span className="font-display text-3xl font-bold text-ink-200">
            {product.name.trim().charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-ink-900">
        {product.name}
      </h3>
      {product.industries.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {product.industries.slice(0, 3).map((ind) => (
            <span
              key={ind.id}
              className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700"
            >
              {ind.name}
            </span>
          ))}
        </div>
      )}
      {product.price_b2c != null && (
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-base font-bold text-ink-900">
            {formatPrice(product.price_b2c)}
          </span>
          <span className="text-xs text-ink-400">/ pc</span>
        </div>
      )}
    </Link>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}
