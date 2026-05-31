"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import ModeToggle from "@/components/ui/ModeToggle";
import { useRequireAuth } from "@/features/auth/queries";
import {
  useCart,
  useClearCart,
  useRemoveCartItem,
  useSetCartMode,
  useUpdateCartItem,
} from "@/features/cart/queries";
import type { CartItem } from "@/features/cart/types";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const isAuthed = useRequireAuth();
  const { data: cart, isLoading } = useCart();
  const clear = useClearCart();
  const setMode = useSetCartMode();

  if (!isAuthed) return null;

  const items = cart?.items ?? [];
  const mode = cart?.mode ?? "b2c";

  return (
    <>
      <Header />
      <main className="flex-1 bg-ink-50 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Your Cart"
            title="Enquiry cart"
            description="Add the fasteners you need and send us the list — we'll get back to you with availability and a quote."
            align="left"
          />

          {isLoading ? (
            <p className="py-20 text-center text-sm text-ink-400">Loading…</p>
          ) : items.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-ink-200 bg-white py-20 text-center">
              <ShoppingCart className="mx-auto h-10 w-10 text-ink-300" />
              <p className="mt-4 text-lg font-semibold text-ink-900">
                Your cart is empty.
              </p>
              <p className="mt-1 text-sm text-ink-500">
                Browse the catalog and add the items you'd like a quote on.
              </p>
              <Link
                href="/#categories"
                className="mt-6 inline-block rounded-lg bg-brand-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-600"
              >
                Shop by category
              </Link>
            </div>
          ) : (
            <>
            <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card">
              <span className="text-sm font-semibold text-ink-700">Pricing</span>
              <ModeToggle
                value={mode}
                onChange={(m) => setMode.mutate(m)}
              />
              {mode === "b2b" && (
                <span className="text-xs text-ink-400">
                  Bulk rates — quantities are held at each item's minimum.
                </span>
              )}
            </div>
            <div className="mt-6 grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
                  <ul className="divide-y divide-ink-100">
                    {items.map((item) => (
                      <CartRow key={item.id} item={item} mode={mode} />
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Remove all items from your cart?")) clear.mutate();
                  }}
                  className="mt-4 text-sm font-semibold text-ink-500 transition hover:text-red-600"
                >
                  Clear cart
                </button>
              </div>

              {/* Summary */}
              <aside>
                <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
                  <p className="font-display text-sm font-bold uppercase text-ink-900">
                    Summary
                  </p>
                  <div className="mt-4 flex justify-between text-sm text-ink-600">
                    <span>Distinct items</span>
                    <span className="font-semibold text-ink-900">
                      {cart?.total_items ?? 0}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-ink-600">
                    <span>Total quantity</span>
                    <span className="font-semibold text-ink-900">
                      {cart?.total_quantity ?? 0}
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between border-t border-ink-100 pt-4">
                    <span className="text-sm font-semibold text-ink-900">
                      Subtotal
                      <span className="ml-1.5 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-500">
                        {mode}
                      </span>
                    </span>
                    <span className="font-display text-xl font-bold text-ink-900">
                      {formatPrice(cart?.subtotal ?? 0)}
                    </span>
                  </div>
                  <Link
                    href="/checkout"
                    className="mt-6 block rounded-lg bg-brand-500 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-brand-600"
                  >
                    Proceed to checkout
                  </Link>
                  <Link
                    href="/#contact"
                    className="mt-3 block rounded-lg border border-ink-200 px-6 py-3 text-center text-sm font-bold text-ink-700 transition hover:bg-ink-50"
                  >
                    Request a quote
                  </Link>
                  <p className="mt-3 text-center text-xs text-ink-400">
                    Taxes and shipping are confirmed when we quote.
                  </p>
                </div>
              </aside>
            </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function CartRow({ item, mode }: { item: CartItem; mode: "b2c" | "b2b" }) {
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();

  const minQty = mode === "b2b" ? item.b2b_min_qty : 1;

  const setQty = (qty: number) => {
    if (qty < minQty) return;
    update.mutate({ productId: item.product_id, quantity: qty });
  };

  return (
    <li className="flex items-center gap-4 p-4">
      <Link
        href={`/product/${item.slug}`}
        className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-100 bg-ink-50"
      >
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          <span className="font-display text-2xl font-bold text-ink-200">
            {item.name.trim().charAt(0).toUpperCase()}
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/product/${item.slug}`}
          className="font-semibold text-ink-900 hover:text-brand-600"
        >
          {item.name}
        </Link>
        {item.sku && <p className="text-xs text-ink-400">SKU: {item.sku}</p>}
        <p className="mt-0.5 text-sm text-ink-500">
          {formatPrice(item.unit_price)}
          {item.unit_price != null && " / pc"}
        </p>
        {mode === "b2b" && item.b2b_min_qty > 1 && (
          <p className="text-xs font-medium text-brand-600">
            min {item.b2b_min_qty} pcs
          </p>
        )}
        {!item.is_active && (
          <p className="text-xs font-semibold text-amber-600">
            No longer available
          </p>
        )}
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center rounded-lg border border-ink-200">
        <button
          onClick={() => setQty(item.quantity - 1)}
          disabled={update.isPending || item.quantity <= minQty}
          className="p-2 text-ink-500 transition hover:text-brand-600 disabled:opacity-40"
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-10 text-center text-sm font-semibold text-ink-900">
          {item.quantity}
        </span>
        <button
          onClick={() => setQty(item.quantity + 1)}
          disabled={update.isPending}
          className="p-2 text-ink-500 transition hover:text-brand-600 disabled:opacity-40"
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="w-20 shrink-0 text-right text-sm font-semibold text-ink-900">
        {formatPrice(item.line_total)}
      </div>

      <button
        onClick={() => remove.mutate(item.product_id)}
        disabled={remove.isPending}
        className="rounded-md p-2 text-ink-400 transition hover:bg-ink-50 hover:text-red-600"
        aria-label="Remove item"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
