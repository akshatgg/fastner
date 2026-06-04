"use client";

import Link from "next/link";
import { CalendarClock, LifeBuoy, Package, ShoppingCart } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import { useRequireAuth } from "@/features/auth/queries";
import { useMyOrders } from "@/features/orders/queries";
import {
  orderStatusBadge,
  orderStatusHint,
  paymentStatusBadge,
} from "@/features/orders/status";
import type { Order } from "@/features/orders/types";
import { formatPrice } from "@/lib/format";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function OrdersPage() {
  const isAuthed = useRequireAuth();
  const { data: orders, isLoading } = useMyOrders();

  if (!isAuthed) return null;

  const list = orders ?? [];

  return (
    <>
      <Header />
      <main className="flex-1 bg-ink-50 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Your account"
            title="My orders"
            description="Track your orders, see delivery dates, and raise a support ticket if anything's off."
            align="left"
          />

          <div className="mt-8 space-y-5">
            {isLoading ? (
              <>
                <div className="h-44 animate-pulse rounded-2xl bg-white" />
                <div className="h-44 animate-pulse rounded-2xl bg-white" />
              </>
            ) : list.length === 0 ? (
              <div className="rounded-2xl border border-ink-100 bg-white p-12 text-center shadow-card">
                <Package className="mx-auto h-10 w-10 text-ink-300" />
                <p className="mt-4 text-lg font-semibold text-ink-900">
                  No orders yet
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  When you place an order, it'll show up here.
                </p>
                <Link
                  href="/#categories"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-600"
                >
                  <ShoppingCart className="h-4 w-4" /> Shop by category
                </Link>
              </div>
            ) : (
              list.map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function OrderCard({ order }: { order: Order }) {
  const status = orderStatusBadge(order.status);
  const payment = paymentStatusBadge(order.payment_status);

  return (
    <article className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 bg-ink-50/40 px-5 py-4 sm:px-6">
        <div>
          <p className="font-display text-base font-bold uppercase tracking-wide text-ink-900">
            {order.reference}
          </p>
          <p className="text-xs text-ink-500">
            Placed {formatDate(order.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${status.cls}`}
          >
            {status.label}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${payment.cls}`}
          >
            {payment.label}
          </span>
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6">
        {/* Status hint */}
        <p className="text-sm text-ink-600">{orderStatusHint(order.status)}</p>

        {order.status === "declined" && order.decline_reason && (
          <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Reason: {order.decline_reason}
          </p>
        )}

        {order.expected_delivery_date &&
          ["approved", "shipped"].includes(order.status) && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">
              <CalendarClock className="h-4 w-4" />
              Expected delivery {formatDate(order.expected_delivery_date)}
            </p>
          )}

        {/* Items */}
        <ul className="mt-4 divide-y divide-ink-50">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-100 bg-ink-50">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt={item.product_name}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <Package className="h-5 w-5 text-ink-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {item.product_slug ? (
                  <Link
                    href={`/product/${item.product_slug}`}
                    className="line-clamp-1 text-sm font-semibold text-ink-900 hover:text-brand-600"
                  >
                    {item.product_name}
                  </Link>
                ) : (
                  <span className="line-clamp-1 text-sm font-semibold text-ink-900">
                    {item.product_name}
                  </span>
                )}
                <p className="text-xs text-ink-500">
                  {formatPrice(item.unit_price)} × {item.quantity}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-ink-900">
                {formatPrice(item.line_total)}
              </span>
            </li>
          ))}
        </ul>

        {/* Totals */}
        <div className="mt-4 space-y-1.5 border-t border-ink-100 pt-4 text-sm">
          <div className="flex justify-between text-ink-600">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
              <span>−{formatPrice(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-ink-600">
            <span>GST ({order.tax_rate}%)</span>
            <span>{formatPrice(order.tax_amount)}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-bold text-ink-900">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/support?order=${order.id}&ref=${encodeURIComponent(order.reference)}`}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-400 hover:text-brand-600"
          >
            <LifeBuoy className="h-4 w-4" /> Raise a ticket
          </Link>
        </div>
      </div>
    </article>
  );
}
