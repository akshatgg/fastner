"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, MapPin, Plus, ShoppingCart, Star, Tag } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import { useRequireAuth } from "@/features/auth/queries";
import { useCart } from "@/features/cart/queries";
import AddressForm from "@/features/address/AddressForm";
import { formatAddressLines } from "@/features/address/AddressBook";
import { useAddresses, useCreateAddress } from "@/features/address/queries";
import type { Address } from "@/features/address/types";
import { createRazorpayOrder } from "@/features/payments/api";
import type { RazorpayCallbackResponse } from "@/features/payments/types";
import { usePaymentConfig } from "@/features/payments/queries";
import { usePlaceOrder } from "@/features/orders/queries";
import { usePublicSettings } from "@/features/settings/queries";
import { useValidateCoupon } from "@/features/coupons/queries";
import type { CouponPreview } from "@/features/coupons/types";
import { loadRazorpayScript, openRazorpayCheckout } from "@/lib/razorpay";
import { ApiError } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";

export default function CheckoutPage() {
  const isAuthed = useRequireAuth();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses, isLoading: addrLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const placeOrderMutation = usePlaceOrder();
  const { data: paymentConfig } = usePaymentConfig();
  const { data: storeSettings } = usePublicSettings();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [paying, setPaying] = useState(false);
  const [placed, setPlaced] = useState<{ ref: string; address: Address } | null>(
    null,
  );

  // Applied coupon (validated server-side against the live cart).
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);
  const validateCoupon = useValidateCoupon();

  const list = useMemo(() => addresses ?? [], [addresses]);
  const items = cart?.items ?? [];
  const mode = cart?.mode ?? "b2c";

  // GST is applied on the product subtotal AFTER any coupon discount — the same
  // total the backend charges and persists with the order. Rounded to paise.
  const subtotal = cart?.subtotal ?? 0;
  const gstRate = storeSettings?.gst_rate ?? 0;
  const discount = Math.min(coupon?.discount_amount ?? 0, subtotal);
  const taxable = subtotal - discount;
  const taxAmount = Math.round(taxable * gstRate) / 100;
  const total = taxable + taxAmount;

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    try {
      const preview = await validateCoupon.mutateAsync(code);
      setCoupon(preview);
      toast.success(`Coupon ${preview.code} applied.`);
    } catch (e) {
      setCoupon(null);
      toast.error(e instanceof ApiError ? e.message : "Invalid coupon code.");
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
  };

  // Pre-select the default address (or the first) once they load.
  useEffect(() => {
    if (selectedId || list.length === 0) return;
    const preferred = list.find((a) => a.is_default) ?? list[0];
    setSelectedId(preferred.id);
  }, [list, selectedId]);

  if (!isAuthed) return null;

  const selected = list.find((a) => a.id === selectedId) ?? null;

  // Persist the order from the cart. The backend snapshots the cart, verifies
  // any payment, empties the cart, and returns the real order reference.
  const submitOrder = async (
    address: Address,
    payment?: RazorpayCallbackResponse,
  ) => {
    try {
      const order = await placeOrderMutation.mutateAsync({
        address_id: address.id,
        coupon_code: coupon?.code ?? null,
        ...(payment ?? {}),
      });
      setPlaced({ ref: order.reference, address });
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "We couldn't place your order.",
      );
    }
  };

  const placeOrder = async () => {
    if (!selected) return;

    // When Razorpay is configured (test key on dev, live key on prod) run the
    // payment flow. Until then this falls through to a plain order placement —
    // the order is simply placed without payment.
    if (paymentConfig?.enabled) {
      setPaying(true);
      try {
        const loaded = await loadRazorpayScript();
        if (!loaded) throw new Error("Could not load the payment gateway.");
        const order = await createRazorpayOrder(coupon?.code ?? null);
        const opened = openRazorpayCheckout({
          order,
          customer: {
            name: selected.full_name,
            email: selected.email,
            contact: selected.phone,
          },
          onSuccess: async (resp) => {
            // The backend re-verifies the signature when creating the order.
            try {
              await submitOrder(selected, resp);
            } finally {
              setPaying(false);
            }
          },
          onDismiss: () => setPaying(false),
        });
        if (!opened) throw new Error("Could not open the payment gateway.");
      } catch (e) {
        setPaying(false);
        toast.error(
          e instanceof Error ? e.message : "Payment could not be started.",
        );
      }
      return;
    }

    // No payment configured — place the order against the chosen address and
    // empty the cart, mirroring a real checkout.
    await submitOrder(selected);
  };

  // --- Order placed confirmation -------------------------------------------
  if (placed) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-ink-50 py-16 sm:py-24">
          <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
            <CheckCircle2 className="mx-auto h-16 w-16 text-success-500" />
            <h1 className="mt-6 font-display text-2xl font-bold uppercase text-ink-900">
              Order placed
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              Thank you! Your order reference is{" "}
              <span className="font-bold text-ink-900">{placed.ref}</span>. We'll
              confirm availability and dispatch details shortly.
            </p>
            <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-6 text-left shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Delivering to
              </p>
              <p className="mt-2 font-semibold text-ink-900">
                {placed.address.full_name}
              </p>
              <p className="mt-1 text-sm text-ink-600">
                {formatAddressLines(placed.address)}
              </p>
              <p className="mt-1 text-sm text-ink-500">Phone: {placed.address.phone}</p>
            </div>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/orders"
                className="inline-block w-full rounded-lg bg-brand-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-600 sm:w-auto"
              >
                View my orders
              </Link>
              <Link
                href="/#categories"
                className="inline-block w-full rounded-lg border border-ink-200 px-6 py-3 text-sm font-bold text-ink-700 transition hover:border-brand-400 hover:text-brand-600 sm:w-auto"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // --- Empty cart guard -----------------------------------------------------
  if (!cartLoading && items.length === 0) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-ink-50 py-16 sm:py-24">
          <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
            <ShoppingCart className="mx-auto h-10 w-10 text-ink-300" />
            <p className="mt-4 text-lg font-semibold text-ink-900">
              Your cart is empty.
            </p>
            <Link
              href="/#categories"
              className="mt-6 inline-block rounded-lg bg-brand-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-600"
            >
              Shop by category
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-ink-50 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Checkout"
            title="Delivery details"
            description="Choose where you'd like this order delivered, then place your order."
            align="left"
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Address selection */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold uppercase text-ink-900">
                    Delivery address
                  </h2>
                  {!adding && (
                    <button
                      onClick={() => setAdding(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500 px-3 py-2 text-sm font-bold text-brand-600 transition hover:bg-brand-50"
                    >
                      <Plus className="h-4 w-4" /> Add new
                    </button>
                  )}
                </div>

                {addrLoading ? (
                  <p className="py-8 text-center text-sm text-ink-400">Loading…</p>
                ) : (
                  <ul className="space-y-3">
                    {list.map((a) => (
                      <li key={a.id}>
                        <label
                          className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                            selectedId === a.id
                              ? "border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/30"
                              : "border-ink-200 hover:border-ink-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="delivery-address"
                            checked={selectedId === a.id}
                            onChange={() => setSelectedId(a.id)}
                            className="mt-1 h-4 w-4 text-brand-500 focus:ring-brand-500"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-ink-900">
                                {a.full_name}
                              </span>
                              <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500">
                                {a.address_type}
                              </span>
                              {a.is_default && (
                                <span className="inline-flex items-center gap-1 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-600">
                                  <Star className="h-3 w-3 fill-brand-500 text-brand-500" />
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-ink-600">
                              {formatAddressLines(a)}
                            </p>
                            <p className="mt-1 text-sm text-ink-500">
                              Phone: {a.phone}
                              {a.alt_phone && `, ${a.alt_phone}`}
                            </p>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}

                {!addrLoading && list.length === 0 && !adding && (
                  <div className="rounded-xl border border-dashed border-ink-200 py-10 text-center">
                    <MapPin className="mx-auto h-8 w-8 text-ink-300" />
                    <p className="mt-3 text-sm text-ink-500">
                      Add a delivery address to continue.
                    </p>
                  </div>
                )}

                {adding && (
                  <div className="mt-5 rounded-xl border border-ink-200 bg-ink-50/50 p-4 sm:p-6">
                    <p className="mb-4 font-semibold text-ink-900">New address</p>
                    <AddressForm
                      submitting={createAddress.isPending}
                      hideDefaultToggle={list.length === 0}
                      onSubmit={(input) =>
                        createAddress.mutate(input, {
                          onSuccess: (created) => {
                            setSelectedId(created.id);
                            setAdding(false);
                          },
                        })
                      }
                      onCancel={() => setAdding(false)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Order summary */}
            <aside>
              <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
                <p className="font-display text-sm font-bold uppercase text-ink-900">
                  Order summary
                </p>
                <ul className="mt-4 space-y-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between gap-2 text-sm text-ink-600"
                    >
                      <span className="min-w-0 truncate">
                        {item.name}{" "}
                        <span className="text-ink-400">×{item.quantity}</span>
                      </span>
                      <span className="shrink-0 font-medium text-ink-900">
                        {formatPrice(item.line_total)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Coupon */}
                <div className="mt-4 border-t border-ink-100 pt-4">
                  {coupon ? (
                    <div className="flex items-center justify-between rounded-lg border border-success-200 bg-success-50 px-3 py-2">
                      <span className="flex items-center gap-2 text-sm font-semibold text-success-700">
                        <Tag className="h-4 w-4" />
                        {coupon.code} applied
                      </span>
                      <button
                        onClick={removeCoupon}
                        className="text-xs font-semibold text-ink-500 hover:text-danger-600"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyCoupon();
                          }
                        }}
                        placeholder="Coupon code"
                        className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm uppercase outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={validateCoupon.isPending || !couponInput.trim()}
                        className="shrink-0 rounded-lg border border-brand-500 px-4 py-2 text-sm font-bold text-brand-600 transition hover:bg-brand-50 disabled:opacity-50"
                      >
                        {validateCoupon.isPending ? "…" : "Apply"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
                  <div className="flex items-baseline justify-between text-ink-600">
                    <span>
                      Subtotal
                      <span className="ml-1.5 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-500">
                        {mode}
                      </span>
                    </span>
                    <span className="font-medium text-ink-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-baseline justify-between text-success-700">
                      <span>Discount ({coupon?.code})</span>
                      <span className="font-medium">−{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between text-ink-600">
                    <span>GST ({gstRate}%)</span>
                    <span className="font-medium text-ink-900">
                      {formatPrice(taxAmount)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-ink-100 pt-2">
                    <span className="text-sm font-semibold text-ink-900">Total</span>
                    <span className="font-display text-xl font-bold text-ink-900">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={placeOrder}
                  disabled={!selected || paying || placeOrderMutation.isPending}
                  className="mt-6 block w-full rounded-lg bg-brand-500 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
                >
                  {paying
                    ? "Processing…"
                    : paymentConfig?.enabled
                      ? `Pay ${formatPrice(total)} & place order`
                      : "Place order"}
                </button>
                {!selected && (
                  <p className="mt-3 text-center text-xs text-ink-400">
                    Select a delivery address to place your order.
                  </p>
                )}
                <p className="mt-3 text-center text-xs text-ink-400">
                  Inclusive of {gstRate}% GST. Shipping is confirmed on approval.
                </p>
                <Link
                  href="/cart"
                  className="mt-4 block text-center text-sm font-semibold text-ink-500 transition hover:text-brand-600"
                >
                  Back to cart
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
