"use client";

import { useState } from "react";
import { Pencil, Plus, Ticket, Trash2 } from "lucide-react";

import Modal from "@/components/ui/Modal";
import {
  useAdminCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useUpdateCoupon,
} from "@/features/coupons/queries";
import type { Coupon, CouponInput, DiscountType } from "@/features/coupons/types";
import { formatPrice } from "@/lib/format";

const inputCls =
  "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const labelCls =
  "mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500";

function formatDate(value: string | null): string {
  if (!value) return "No expiry";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function discountLabel(c: Coupon): string {
  if (c.discount_type === "percent") {
    return `${c.discount_value}% off${c.max_discount ? ` (max ${formatPrice(c.max_discount)})` : ""}`;
  }
  return `${formatPrice(c.discount_value)} off`;
}

export default function AdminCouponsPage() {
  const { data: coupons, isLoading } = useAdminCoupons();
  const del = useDeleteCoupon();
  const update = useUpdateCoupon();
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [creating, setCreating] = useState(false);

  const list = coupons ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-ink-900">
            Coupons
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Create discount codes — set the discount, usage limit and expiry.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" /> New coupon
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-ink-400">Loading…</p>
        ) : list.length === 0 ? (
          <div className="py-16 text-center">
            <Ticket className="mx-auto h-9 w-9 text-ink-300" />
            <p className="mt-3 text-sm text-ink-500">No coupons yet.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Discount</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Used</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Expires</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {list.map((c) => (
                <tr key={c.id} className="hover:bg-ink-50/40">
                  <td className="px-4 py-3">
                    <p className="font-bold text-ink-900">{c.code}</p>
                    {c.min_order_amount != null && (
                      <p className="text-xs text-ink-400">
                        Min order {formatPrice(c.min_order_amount)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{discountLabel(c)}</td>
                  <td className="hidden px-4 py-3 text-ink-700 sm:table-cell">
                    {c.used_count}
                    {c.usage_limit != null ? ` / ${c.usage_limit}` : ""}
                  </td>
                  <td className="hidden px-4 py-3 text-ink-700 md:table-cell">
                    {formatDate(c.expires_at)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        update.mutate({ id: c.id, input: { is_active: !c.is_active } })
                      }
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        c.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-ink-200 text-ink-600"
                      }`}
                      title="Click to toggle"
                    >
                      {c.is_active ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditing(c)}
                        className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-50 hover:text-brand-600"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete coupon ${c.code}?`)) del.mutate(c.id);
                        }}
                        className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-50 hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={creating || Boolean(editing)}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? "Edit coupon" : "New coupon"}
      >
        <CouponForm
          coupon={editing}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      </Modal>
    </div>
  );
}

function CouponForm({
  coupon,
  onDone,
}: {
  coupon: Coupon | null;
  onDone: () => void;
}) {
  const create = useCreateCoupon();
  const update = useUpdateCoupon();

  const [code, setCode] = useState(coupon?.code ?? "");
  const [description, setDescription] = useState(coupon?.description ?? "");
  const [discountType, setDiscountType] = useState<DiscountType>(
    coupon?.discount_type ?? "percent",
  );
  const [discountValue, setDiscountValue] = useState(
    coupon ? String(coupon.discount_value) : "",
  );
  const [maxDiscount, setMaxDiscount] = useState(
    coupon?.max_discount != null ? String(coupon.max_discount) : "",
  );
  const [minOrder, setMinOrder] = useState(
    coupon?.min_order_amount != null ? String(coupon.min_order_amount) : "",
  );
  const [usageLimit, setUsageLimit] = useState(
    coupon?.usage_limit != null ? String(coupon.usage_limit) : "",
  );
  const [expires, setExpires] = useState(
    coupon?.expires_at ? coupon.expires_at.slice(0, 10) : "",
  );
  const [isActive, setIsActive] = useState(coupon?.is_active ?? true);

  const num = (s: string): number | null => {
    const n = parseFloat(s);
    return s.trim() && !Number.isNaN(n) ? n : null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = num(discountValue);
    if (!code.trim() || value == null || value <= 0) return;

    const payload: CouponInput = {
      code: code.trim().toUpperCase(),
      description: description.trim() || null,
      discount_type: discountType,
      discount_value: value,
      max_discount: discountType === "percent" ? num(maxDiscount) : null,
      min_order_amount: num(minOrder),
      usage_limit: usageLimit.trim() ? Math.max(1, parseInt(usageLimit, 10)) : null,
      // Expire at end of the chosen day.
      expires_at: expires ? new Date(`${expires}T23:59:59`).toISOString() : null,
      is_active: isActive,
    };

    if (coupon) await update.mutateAsync({ id: coupon.id, input: payload });
    else await create.mutateAsync(payload);
    onDone();
  };

  const busy = create.isPending || update.isPending;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Code *</label>
          <input
            className={`${inputCls} uppercase`}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SAVE10"
            required
          />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select
            className={inputCls}
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as DiscountType)}
          >
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed amount (₹)</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <input
          className={inputCls}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. 10% off your first order"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>
            {discountType === "percent" ? "Discount (%)" : "Discount (₹)"} *
          </label>
          <input
            className={inputCls}
            type="number"
            min={0}
            step="0.01"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            required
          />
        </div>
        {discountType === "percent" && (
          <div>
            <label className={labelCls}>Max discount (₹)</label>
            <input
              className={inputCls}
              type="number"
              min={0}
              step="0.01"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              placeholder="Optional cap"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Min order (₹)</label>
          <input
            className={inputCls}
            type="number"
            min={0}
            step="0.01"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <label className={labelCls}>Usage limit</label>
          <input
            className={inputCls}
            type="number"
            min={1}
            step="1"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            placeholder="Unlimited"
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Expires on</label>
        <input
          className={inputCls}
          type="date"
          value={expires}
          onChange={(e) => setExpires(e.target.value)}
        />
        <p className="mt-1 text-xs text-ink-400">Leave blank for no expiry.</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-800">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
        />
        Active (uncheck to discard the code)
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-500 hover:text-ink-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {busy ? "Saving…" : coupon ? "Save changes" : "Create coupon"}
        </button>
      </div>
    </form>
  );
}
