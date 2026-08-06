"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Check,
  ChevronRight,
  Download,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ModeToggle from "@/components/ui/ModeToggle";
import { usePublicProduct, useRelatedProducts } from "@/features/catalog/queries";
import { useAddToCart } from "@/features/cart/queries";
import { formatPrice } from "@/lib/format";
import { downloadProductPdf } from "@/lib/product-pdf";
import type { ProductSearchItem } from "@/features/catalog/types";
import { useModeStore } from "@/lib/store/mode-store";
import ProductReviews from "./ProductReviews";
import ProductTabs from "./ProductTabs";

/** The spec key that actually holds a bullet list rather than a value. Matched
 *  case- and separator-insensitively, since it is authored in the seed data. */
const KEY_FEATURES = "keyfeatures";

/**
 * The spec series as authored in the client's product-detailing sheet.
 *
 * The API cannot give us this order: `specifications` is a Postgres JSONB
 * column, and JSONB re-sorts object keys by length then bytewise — so whatever
 * order the seed writes, the spec block arrives here as "Grade, Pitch, Finish,
 * Material, …". Restoring the authored order client-side is what keeps the
 * table reading the way the sheet does. Keys not listed here (a future product
 * family) keep their incoming order and follow the known ones.
 */
const SPEC_ORDER = [
  "IBC Part Number",
  "Thread Size",
  "Length (L)",
  "Pitch",
  "Material",
  "Finish",
  "Socket Size (J)",
  "Manufacturing Standard",
  "Grade",
  "Weight per 100 Units",
  "Shipping Destinations",
  "Weight (100 items)",
].map((k) => k.toLowerCase().replace(/[\s_-]/g, ""));

/**
 * Split a product's `specifications` into its key-feature bullets and the
 * remaining rows for the spec table. Features arrive as a JSON array, but a
 * comma-joined string is accepted too so an admin-typed value still lists
 * correctly instead of rendering as one long line.
 */
function splitKeyFeatures(specifications: Record<string, unknown> | undefined) {
  const entries = specifications ? Object.entries(specifications) : [];
  const norm = (k: string) => k.toLowerCase().replace(/[\s_-]/g, "");

  const hit = entries.find(([k]) => norm(k) === KEY_FEATURES);
  const raw = hit?.[1];

  const keyFeatures = (
    Array.isArray(raw)
      ? raw.map(String)
      : typeof raw === "string"
        ? raw.split(",")
        : []
  )
    .map((f) => f.trim())
    .filter(Boolean);

  const rest = entries.filter(([k]) => norm(k) !== KEY_FEATURES);
  const rank = (k: string) => {
    const i = SPEC_ORDER.indexOf(norm(k));
    return i === -1 ? SPEC_ORDER.length : i;
  };

  return {
    keyFeatures,
    // Stable sort: known keys take the sheet's series, unknown keys keep the
    // order they arrived in and sit after them.
    specs: rest
      .map((entry, i) => ({ entry, i }))
      .sort((a, b) => rank(a.entry[0]) - rank(b.entry[0]) || a.i - b.i)
      .map((x) => x.entry),
  };
}

export default function ProductView({ slug }: { slug: string }) {
  const { data: product, isLoading, isError } = usePublicProduct(slug);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const addToCart = useAddToCart();
  const mode = useModeStore((s) => s.mode);

  const primary = product?.categories.find((c) => c.is_primary) ?? product?.categories[0];
  // "Key Features" is a list, not a value — it reads as a comma run-on in the
  // spec table, so it is lifted out and shown as its own checked list above.
  const { keyFeatures, specs } = splitKeyFeatures(product?.specifications);

  const isB2b = mode === "b2b";
  const price = product ? (isB2b ? product.price_b2b : product.price_b2c) : null;
  const minQty = isB2b ? (product?.b2b_min_qty ?? 1) : 1;

  // Keep the quantity at or above the bulk minimum when in B2B mode.
  useEffect(() => {
    setQty((q) => Math.max(q, minQty));
  }, [minQty]);

  const handleDownload = async () => {
    if (!product) return;
    setDownloading(true);
    try {
      await downloadProductPdf(product);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-ink-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
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

              <div className="mt-6 grid gap-10 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr]">
                {/* Gallery — larger image, sticky on desktop so it fills the space */}
                <div className="lg:sticky lg:top-24 lg:self-start">
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-ink-100 bg-white">
                    {product.images[active] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[active]}
                        alt={product.name}
                        className="h-full w-full object-contain p-4 sm:p-8"
                      />
                    ) : (
                      <span className="font-display text-8xl font-bold text-ink-200">
                        {product.name.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {product.images.length > 1 && (
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      {product.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActive(i)}
                          className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border bg-white ${
                            i === active ? "border-brand-500 ring-2 ring-brand-500/20" : "border-ink-100"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="" className="h-full w-full object-contain p-1.5" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div>
                  <h1 className="font-display text-2xl font-bold uppercase leading-tight text-ink-900 sm:text-3xl lg:text-4xl">
                    {product.name}
                  </h1>
                  {product.sku && (
                    <p className="mt-1 text-sm text-ink-400">
                      Part Number: {product.sku}
                    </p>
                  )}

                  {keyFeatures.length > 0 && (
                    <div className="mt-5">
                      <h2 className="font-display text-base font-bold uppercase tracking-wide text-ink-900">
                        Key Features
                      </h2>
                      <ul className="mt-3 space-y-2">
                        {keyFeatures.map((feature) => (
                          <li key={feature} className="flex gap-2.5 text-sm leading-relaxed text-ink-700">
                            <Check
                              aria-hidden
                              strokeWidth={3}
                              className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
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

                  {product.industries.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
                      <p className="font-display text-sm font-bold uppercase text-ink-900">
                        Industries Served
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {product.industries.map((ind) => (
                          <span
                            key={ind.id}
                            className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                          >
                            {ind.name}
                          </span>
                        ))}
                      </div>
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

                  {product.is_out_of_stock && (
                    <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-2.5 text-sm font-semibold text-danger-700">
                      Out of stock — currently unavailable. Check back soon or
                      enquire below.
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center rounded-lg border border-ink-200">
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(minQty, q - 1))}
                        className="p-2.5 text-ink-500 transition hover:text-brand-600 disabled:opacity-40"
                        disabled={qty <= minQty || product.is_out_of_stock}
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
                        className="p-2.5 text-ink-500 transition hover:text-brand-600 disabled:opacity-40"
                        disabled={product.is_out_of_stock}
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
                      disabled={addToCart.isPending || product.is_out_of_stock}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50 sm:flex-none"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {product.is_out_of_stock
                        ? "Out of stock"
                        : addToCart.isPending
                          ? "Adding…"
                          : "Add to cart"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-50"
                  >
                    {downloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {downloading ? "Preparing PDF…" : "Download spec sheet (PDF)"}
                  </button>

                  <Link
                    href="/#contact"
                    className="mt-3 block text-sm font-semibold text-ink-500 transition hover:text-brand-600"
                  >
                    Or enquire about this product →
                  </Link>
                </div>
              </div>

              {/* Everything below the buy box — specs + drawing, the written
                  description, and reviews — lives in one tabbed panel. */}
              <ProductTabs
                productName={product.name}
                specs={specs}
                details={
                  product.description ? (
                    <ProductDescription text={product.description} />
                  ) : (
                    <p className="text-sm text-ink-400">
                      No description recorded for this product yet.
                    </p>
                  )
                }
                reviews={<ProductReviews slug={slug} />}
              />

              <RelatedProducts slug={slug} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

/**
 * Renders a product description, giving the `### Heading` lines (use-case
 * sections seeded from the catalog) proper sub-headings instead of running them
 * into the body text. Plain descriptions (no markers) fall back to paragraphs,
 * with the first block treated as a lead line.
 */
function ProductDescription({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="mt-4 space-y-5">
      {blocks.map((block, i) => {
        if (block.startsWith("### ")) {
          const nl = block.indexOf("\n");
          const heading = (nl === -1 ? block.slice(4) : block.slice(4, nl)).trim();
          const body = nl === -1 ? "" : block.slice(nl + 1).trim();
          return (
            <div key={i}>
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-900">
                {heading}
              </h3>
              {body && <p className="mt-1.5 leading-relaxed text-ink-600">{body}</p>}
            </div>
          );
        }
        return (
          <p
            key={i}
            className={
              i === 0
                ? "leading-relaxed font-medium text-ink-800"
                : "leading-relaxed text-ink-600"
            }
          >
            {block}
          </p>
        );
      })}
    </div>
  );
}

function RelatedProducts({ slug }: { slug: string }) {
  const { data } = useRelatedProducts(slug);
  if (!data || data.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="font-display text-xl font-bold uppercase tracking-wide text-ink-900">
        You may also like
      </h2>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {data.map((p) => (
          <RelatedCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

function RelatedCard({ product }: { product: ProductSearchItem }) {
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
      {product.price_b2c != null && (
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-base font-bold text-ink-900">
            {formatPrice(product.price_b2c)}
          </span>
          <span className="text-xs text-ink-400">/ pc</span>
        </div>
      )}
    </Link>
  );
}
