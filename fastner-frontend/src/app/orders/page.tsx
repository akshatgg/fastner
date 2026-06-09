"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, LifeBuoy, Package, ShoppingCart } from "lucide-react";

import AccountLayout from "@/components/account/AccountLayout";
import SectionHeading from "@/components/ui/SectionHeading";
import Modal from "@/components/ui/Modal";
import { useMyOrders } from "@/features/orders/queries";
import {
  orderStatusBadge,
  orderStatusHint,
  paymentStatusBadge,
} from "@/features/orders/status";
import type { Order } from "@/features/orders/types";
import { useCreateTicket } from "@/features/support/queries";
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
  const { data: orders, isLoading } = useMyOrders();
  const list = orders ?? [];

  return (
    <AccountLayout>
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
            <p className="mt-4 text-lg font-semibold text-ink-900">No orders yet</p>
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
    </AccountLayout>
  );
}

function OrderCard({ order }: { order: Order }) {
  const status = orderStatusBadge(order.status);
  const payment = paymentStatusBadge(order.payment_status);
  const [ticketOpen, setTicketOpen] = useState(false);

  return (
    <article className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-ink-100 bg-ink-50/40 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <p className="break-words font-display text-base font-bold uppercase tracking-wide text-ink-900">
            {order.reference}
          </p>
          <p className="text-xs text-ink-500">Placed {formatDate(order.created_at)}</p>
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
          <p className="mt-2 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
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
            <div className="flex justify-between text-success-700">
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

        {/* Actions — raise a ticket for THIS order, inline */}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => setTicketOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-400 hover:text-brand-600"
          >
            <LifeBuoy className="h-4 w-4" /> Raise a ticket
          </button>
        </div>
      </div>

      <Modal
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        title={`Raise a ticket — ${order.reference}`}
      >
        <RaiseTicketForm order={order} onDone={() => setTicketOpen(false)} />
      </Modal>
    </article>
  );
}

function RaiseTicketForm({ order, onDone }: { order: Order; onDone: () => void }) {
  const create = useCreateTicket();
  const [subject, setSubject] = useState(`Order ${order.reference}`);
  const [message, setMessage] = useState("");

  const inputCls =
    "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    await create.mutateAsync({
      subject: subject.trim(),
      message: message.trim(),
      category: "order",
      order_id: order.id,
    });
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="inline-block rounded bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">
        Regarding order {order.reference}
      </p>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
          Subject
        </label>
        <input
          className={inputCls}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
          How can we help?
        </label>
        <textarea
          className={inputCls}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the issue with this order…"
          required
        />
      </div>
      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-500 hover:text-ink-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={create.isPending || !subject.trim() || !message.trim()}
          className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {create.isPending ? "Submitting…" : "Submit ticket"}
        </button>
      </div>
    </form>
  );
}
