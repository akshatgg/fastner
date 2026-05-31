"use client";

import { useState, type FormEvent } from "react";

import type { Address, AddressInput, AddressType } from "./types";

const TYPES: { value: AddressType; label: string }[] = [
  { value: "home", label: "Home" },
  { value: "work", label: "Work" },
  { value: "other", label: "Other" },
];

const inputClass =
  "w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500";

function emptyInput(): AddressInput {
  return {
    full_name: "",
    phone: "",
    alt_phone: "",
    email: "",
    pincode: "",
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    state: "",
    country: "India",
    gst_number: "",
    address_type: "home",
    is_default: false,
  };
}

function fromAddress(a: Address): AddressInput {
  return {
    full_name: a.full_name,
    phone: a.phone,
    alt_phone: a.alt_phone ?? "",
    email: a.email ?? "",
    pincode: a.pincode,
    line1: a.line1,
    line2: a.line2,
    landmark: a.landmark ?? "",
    city: a.city,
    state: a.state,
    country: a.country,
    gst_number: a.gst_number ?? "",
    address_type: a.address_type,
    is_default: a.is_default,
  };
}

export default function AddressForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save address",
  /** Hide the "make default" checkbox (e.g. the very first address is always default). */
  hideDefaultToggle = false,
}: {
  initial?: Address | null;
  onSubmit: (input: AddressInput) => void;
  onCancel?: () => void;
  submitting?: boolean;
  submitLabel?: string;
  hideDefaultToggle?: boolean;
}) {
  const [form, setForm] = useState<AddressInput>(
    initial ? fromAddress(initial) : emptyInput(),
  );

  const set = <K extends keyof AddressInput>(key: K, value: AddressInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Trim and null-out optional blanks before sending.
    onSubmit({
      ...form,
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      pincode: form.pincode.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: (form.country || "India").trim(),
      alt_phone: form.alt_phone?.trim() || null,
      email: form.email?.trim() || null,
      landmark: form.landmark?.trim() || null,
      gst_number: form.gst_number?.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={labelClass}>Full name *</label>
        <input
          className={inputClass}
          required
          value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          placeholder="Recipient name"
        />
      </div>
      <div>
        <label className={labelClass}>Mobile number *</label>
        <input
          className={inputClass}
          required
          inputMode="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="10-digit mobile number"
        />
      </div>

      <div>
        <label className={labelClass}>Alternate phone</label>
        <input
          className={inputClass}
          inputMode="tel"
          value={form.alt_phone ?? ""}
          onChange={(e) => set("alt_phone", e.target.value)}
          placeholder="Optional"
        />
      </div>
      <div>
        <label className={labelClass}>Email</label>
        <input
          className={inputClass}
          type="email"
          value={form.email ?? ""}
          onChange={(e) => set("email", e.target.value)}
          placeholder="Optional — for delivery updates"
        />
      </div>

      <div className="sm:col-span-2">
        <label className={labelClass}>Flat, House no., Building, Company *</label>
        <input
          className={inputClass}
          required
          value={form.line1}
          onChange={(e) => set("line1", e.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Area, Street, Sector, Village *</label>
        <input
          className={inputClass}
          required
          value={form.line2}
          onChange={(e) => set("line2", e.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Landmark</label>
        <input
          className={inputClass}
          value={form.landmark ?? ""}
          onChange={(e) => set("landmark", e.target.value)}
          placeholder="Optional — e.g. near apollo hospital"
        />
      </div>

      <div>
        <label className={labelClass}>Pincode *</label>
        <input
          className={inputClass}
          required
          inputMode="numeric"
          value={form.pincode}
          onChange={(e) => set("pincode", e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass}>City / Town *</label>
        <input
          className={inputClass}
          required
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>State *</label>
        <input
          className={inputClass}
          required
          value={form.state}
          onChange={(e) => set("state", e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass}>Country *</label>
        <input
          className={inputClass}
          required
          value={form.country ?? "India"}
          onChange={(e) => set("country", e.target.value)}
        />
      </div>

      <div className="sm:col-span-2">
        <label className={labelClass}>GST number</label>
        <input
          className={inputClass}
          value={form.gst_number ?? ""}
          onChange={(e) => set("gst_number", e.target.value.toUpperCase())}
          placeholder="Optional — for a GST tax invoice"
        />
      </div>

      <div className="sm:col-span-2">
        <span className={labelClass}>Address type</span>
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => set("address_type", t.value)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                form.address_type === t.value
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-ink-200 text-ink-600 hover:border-ink-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!hideDefaultToggle && (
        <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(e) => set("is_default", e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm text-ink-700">Make this my default address</span>
        </label>
      )}

      <div className="flex gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-ink-200 px-6 py-2.5 text-sm font-semibold text-ink-600 transition hover:bg-ink-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
