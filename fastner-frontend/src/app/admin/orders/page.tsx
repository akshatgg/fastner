"use client";

import { useState } from "react";
import { CalendarClock, Package } from "lucide-react";

import Modal from "@/components/ui/Modal";
import {
  useAdminOrder,
  useAdminOrders,
  useApproveOrder,
  useDeclineOrder,
  useSetOrderDelivery,
  useUpdateOrderStatus,
} from "@/features/orders/queries";
import {
  orderStatusBadge,
  paymentStatusBadge,
} from "@/features/orders/status";
import type { AdminOrder } from "@/features/orders/types";
import { formatPrice } from "@/lib/format";

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending_approval", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
];

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState("");
  const { data: orders, isLoading } = useAdminOrders(filter);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = orders ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-ink-900">
        Orders
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Review and approve orders, set delivery dates, and manage fulfilment.
      </p>

      {/* Filter tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              filter === f.value
                ? "bg-brand-500 text-white"
                : "bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-ink-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-ink-400">Loading…</p>
        ) : list.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto h-9 w-9 text-ink-300" />
            <p className="mt-3 text-sm text-ink-500">No orders here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                    Customer
                  </th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {list.map((o) => {
                  const status = orderStatusBadge(o.status);
                  const payment = paymentStatusBadge(o.payment_status);
                  return (
                    <tr key={o.id} className="hover:bg-ink-50/40">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink-900">{o.reference}</p>
                        <p className="whitespace-nowrap text-xs text-ink-400">
                          {formatDate(o.created_at)}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <p className="text-ink-800">{o.customer_name ?? "—"}</p>
                        <p className="text-xs text-ink-400">{o.customer_email}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink-900">
                        {formatPrice(o.total)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`w-fit whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${status.cls}`}
                          >
                            {status.label}
                          </span>
                          <span
                            className={`w-fit whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${payment.cls}`}
                          >
                            {payment.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedId(o.id)}
                          className="whitespace-nowrap rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-semibold text-ink-700 transition hover:border-brand-400 hover:text-brand-600"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title="Order details"
        widthClass="max-w-2xl"
      >
        {selectedId && (
          <OrderDetail id={selectedId} onClose={() => setSelectedId(null)} />
        )}
      </Modal>
    </div>
  );
}

function OrderDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: order, isLoading } = useAdminOrder(id);
  const approve = useApproveOrder();
  const decline = useDeclineOrder();
  const updateStatus = useUpdateOrderStatus();
  const setDelivery = useSetOrderDelivery();

  const [eta, setEta] = useState("");
  const [reason, setReason] = useState("");
  const [declining, setDeclining] = useState(false);

  if (isLoading || !order) {
    return <div className="h-48 animate-pulse rounded-xl bg-ink-50" />;
  }

  const deliveryDate = eta || order.expected_delivery_date || "";
  const busy =
    approve.isPending ||
    decline.isPending ||
    updateStatus.isPending ||
    setDelivery.isPending;

  return (
    <div className="space-y-5">
      <OrderSummary order={order} />

      {/* Lifecycle actions */}
      {order.status === "pending_approval" && !declining && (
        <div className="space-y-3 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
          <p className="text-sm font-semibold text-ink-900">Review this order</p>
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500">
            Expected delivery date (optional)
          </label>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setEta(e.target.value)}
            className="rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              disabled={busy}
              onClick={() =>
                approve.mutateAsync({
                  id: order.id,
                  input: { expected_delivery_date: deliveryDate || null },
                }).then(onClose)
              }
              className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              Approve order
            </button>
            <button
              disabled={busy}
              onClick={() => setDeclining(true)}
              className="rounded-lg border border-danger-200 px-5 py-2 text-sm font-bold text-danger-600 transition hover:bg-danger-50 disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {order.status === "pending_approval" && declining && (
        <div className="space-y-3 rounded-xl border border-danger-200 bg-danger-50/50 p-4">
          <p className="text-sm font-semibold text-danger-800">
            Decline order — {order.payment_status === "paid"
              ? "the payment will be refunded (4–5 working days)."
              : "no payment was captured."}
          </p>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (shown to the customer)…"
            className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <div className="flex gap-3">
            <button
              disabled={busy || !reason.trim()}
              onClick={() =>
                decline.mutateAsync({
                  id: order.id,
                  input: { reason: reason.trim() },
                }).then(onClose)
              }
              className="rounded-lg bg-danger-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-danger-700 disabled:opacity-50"
            >
              Confirm decline
            </button>
            <button
              onClick={() => setDeclining(false)}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-500 hover:text-ink-800"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {(order.status === "approved" || order.status === "shipped") && (
        <div className="space-y-3 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500">
            Expected delivery date
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setEta(e.target.value)}
              className="rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <button
              disabled={busy}
              onClick={() =>
                setDelivery.mutate({
                  id: order.id,
                  input: { expected_delivery_date: deliveryDate || null },
                })
              }
              className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-400 hover:text-brand-600 disabled:opacity-50"
            >
              Save date
            </button>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {order.status === "approved" && (
              <button
                disabled={busy}
                onClick={() =>
                  updateStatus.mutateAsync({
                    id: order.id,
                    input: {
                      status: "shipped",
                      expected_delivery_date: deliveryDate || null,
                    },
                  }).then(onClose)
                }
                className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                Mark as shipped
              </button>
            )}
            {order.status === "shipped" && (
              <button
                disabled={busy}
                onClick={() =>
                  updateStatus.mutateAsync({
                    id: order.id,
                    input: { status: "delivered" },
                  }).then(onClose)
                }
                className="rounded-lg bg-success-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-success-700 disabled:opacity-50"
              >
                Mark as delivered
              </button>
            )}
            <button
              disabled={busy}
              onClick={() =>
                updateStatus.mutateAsync({
                  id: order.id,
                  input: { status: "cancelled" },
                }).then(onClose)
              }
              className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-600 transition hover:border-danger-300 hover:text-danger-600 disabled:opacity-50"
            >
              Cancel order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderSummary({ order }: { order: AdminOrder }) {
  const status = orderStatusBadge(order.status);
  const payment = paymentStatusBadge(order.payment_status);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-lg font-bold text-ink-900">
            {order.reference}
          </p>
          <p className="text-xs text-ink-400">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${status.cls}`}
          >
            {status.label}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${payment.cls}`}
          >
            {payment.label}
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm text-ink-600">
        {order.customer_name}{" "}
        <span className="text-ink-400">· {order.customer_email}</span>
      </p>
      {order.expected_delivery_date && (
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700">
          <CalendarClock className="h-4 w-4" />
          Expected {formatDate(order.expected_delivery_date)}
        </p>
      )}
      {order.decline_reason && (
        <p className="mt-2 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
          Decline reason: {order.decline_reason}
        </p>
      )}

      <ul className="mt-4 divide-y divide-ink-50 rounded-xl border border-ink-100">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-100 bg-ink-50">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={item.product_name}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <Package className="h-4 w-4 text-ink-300" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium text-ink-900">
                {item.product_name}
              </p>
              <p className="text-xs text-ink-400">
                {formatPrice(item.unit_price)} × {item.quantity}
              </p>
            </div>
            <span className="text-sm font-semibold text-ink-900">
              {formatPrice(item.line_total)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between text-ink-600">
          <span>Subtotal ({order.mode.toUpperCase()})</span>
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
    </div>
  );
}
