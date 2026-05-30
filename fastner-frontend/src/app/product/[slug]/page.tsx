"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ChevronRight, Minus, Plus, ShoppingCart } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ModeToggle from "@/components/ui/ModeToggle";
import { usePublicProduct } from "@/features/catalog/queries";
import { useAddToCart } from "@/features/cart/queries";
import { formatPrice } from "@/lib/format";
import { useModeStore } from "@/lib/store/mode-store";

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: product, isLoading, isError } = usePublicProduct(slug);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const addToCart = useAddToCart();
  const mode = useModeStore((s) => s.mode);

  const primary = product?.categories.find((c) => c.is_primary) ?? product?.categories[0];
  const specs = product ? Object.entries(product.specifications) : [];

  const isB2b = mode === "b2b";
  const price = product ? (isB2b ? product.price_b2b : product.price_b2c) : null;
  const minQty = isB2b ? (product?.b2b_min_qty ?? 1) : 1;

  // Keep the quantity at or above the bulk minimum when in B2B mode.
  useEffect(() => {
    setQty((q) => Math.max(q, minQty));
  }, [minQty]);

  return (
    <>
      <Header />
      <main className="flex-1 bg-ink-50 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <p className="py-20 text-center text-sm text-ink-400">Loading…</p>
          ) : isError || !product ? (
            <div className="py-20 text-center">
              <p className="text-lg font-semibold text-ink-900">Product not found.</p>
              <Link href="/#categories" className="mt-2 inline-block text-brand-600">
                Back to categories
              </Link>
            </div>
          ) : (
            <>
              <nav className="flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
                <Link href="/#categories" className="hover:text-brand-600">
                  Categories
                </Link>
                {primary && (
                  <span className="flex items-center gap-1.5">
                    <ChevronRight className="h-3.5 w-3.5 text-ink-300" />
                    <Link href={`/category/${primary.category_id}`} className="hover:text-brand-600">
                      {primary.name}
                    </Link>
                  </span>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-ink-300" />
                <span className="font-semibold text-ink-900">{product.name}</span>
              </nav>

              <div className="mt-6 grid gap-8 md:grid-cols-2">
                {/* Gallery */}
                <div>
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-ink-100 bg-white">
                    {product.images[active] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[active]}
                        alt={product.name}
                        className="h-full w-full object-contain p-6"
                      />
                    ) : (
                      <span className="font-display text-6xl font-bold text-ink-200">
                        {product.name.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {product.images.length > 1 && (
                    <div className="mt-3 flex gap-2">
                      {product.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActive(i)}
                          className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border bg-white ${
                            i === active ? "border-brand-500" : "border-ink-100"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="" className="h-full w-full object-contain p-1" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div>
                  <h1 className="font-display text-2xl font-bold uppercase text-ink-900">
                    {product.name}
                  </h1>
                  {product.sku && (
                    <p className="mt-1 text-sm text-ink-400">SKU: {product.sku}</p>
                  )}
                  {product.short_description && (
                    <p className="mt-3 text-ink-600">{product.short_description}</p>
                  )}

                  {product.filter_values.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {product.filter_values.map((f) => (
                        <span
                          key={f.id}
                          className="rounded-full border border-ink-200 px-3 py-1 text-xs font-medium text-ink-600"
                        >
                          {f.group_name}: {f.value}
                        </span>
                      ))}
                    </div>
                  )}

                  {specs.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
                      <p className="font-display text-sm font-bold uppercase text-ink-900">
                        Specifications
                      </p>
                      <dl className="mt-3 divide-y divide-ink-100">
                        {specs.map(([k, v]) => (
                          <div key={k} className="flex justify-between py-2 text-sm">
                            <dt className="capitalize text-ink-500">{k}</dt>
                            <dd className="font-medium text-ink-900">{String(v)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        Buying as
                      </span>
                      <ModeToggle size="sm" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-display text-3xl font-bold text-ink-900">
                        {formatPrice(price)}
                      </span>
                      {price != null && (
                        <span className="text-sm text-ink-400">/ piece</span>
                      )}
                    </div>
                    {isB2b ? (
                      <p className="mt-1 text-sm font-medium text-brand-600">
                        Bulk rate — minimum order {product.b2b_min_qty} pcs.
                      </p>
                    ) : (
                      product.price_b2b != null && (
                        <p className="mt-1 text-sm text-ink-500">
                          Buying in bulk? Switch to B2B for{" "}
                          {formatPrice(product.price_b2b)}/pc
                          {product.b2b_min_qty > 1
                            ? ` (min ${product.b2b_min_qty} pcs).`
                            : "."}
                        </p>
                      )
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center rounded-lg border border-ink-200">
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(minQty, q - 1))}
                        className="p-2.5 text-ink-500 transition hover:text-brand-600 disabled:opacity-40"
                        disabled={qty <= minQty}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center text-sm font-semibold text-ink-900">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty((q) => q + 1)}
                        className="p-2.5 text-ink-500 transition hover:text-brand-600"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        addToCart.mutate({ product_id: product.id, quantity: qty })
                      }
                      disabled={addToCart.isPending}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {addToCart.isPending ? "Adding…" : "Add to cart"}
                    </button>
                  </div>

                  <Link
                    href="/#contact"
                    className="mt-3 inline-block text-sm font-semibold text-ink-500 transition hover:text-brand-600"
                  >
                    Or enquire about this product →
                  </Link>
                </div>
              </div>

              {product.description && (
                <div className="mt-10 rounded-2xl border border-ink-100 bg-white p-6">
                  <p className="font-display text-sm font-bold uppercase text-ink-900">
                    Description
                  </p>
                  <p className="mt-3 whitespace-pre-line text-ink-600">{product.description}</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
