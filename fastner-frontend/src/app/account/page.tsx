"use client";

import { useState } from "react";
import { BadgeCheck, Pencil, ShieldAlert } from "lucide-react";

import AccountLayout from "@/components/account/AccountLayout";
import SectionHeading from "@/components/ui/SectionHeading";
import { useAuthStore } from "@/lib/store/auth-store";
import { useUpdateProfile } from "@/features/auth/queries";
import AddressBook from "@/features/address/AddressBook";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-ink-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </span>
      <span className="text-base font-medium text-ink-900">{value || "—"}</span>
    </div>
  );
}

/** An inline-editable phone row: shows the number with an edit pencil, swaps to
 *  an input on click, and saves via PATCH /auth/me. */
function PhoneDetail({ phone }: { phone: string | null }) {
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(phone ?? "");

  const save = () => {
    update.mutate(
      { phone: value.trim() },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <div className="flex flex-col gap-2 border-b border-ink-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-semibold uppercase tracking-wide text-ink-400">
        Phone
      </span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="tel"
            inputMode="tel"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") {
                setValue(phone ?? "");
                setEditing(false);
              }
            }}
            placeholder="Enter your phone number"
            className="w-48 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            onClick={save}
            disabled={update.isPending}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            {update.isPending ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => {
              setValue(phone ?? "");
              setEditing(false);
            }}
            className="rounded-lg border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="group inline-flex items-center gap-2 text-base font-medium text-ink-900 transition hover:text-brand-600"
        >
          {phone || <span className="text-ink-400">Add phone number</span>}
          <Pencil className="h-4 w-4 text-ink-400 transition group-hover:text-brand-600" />
        </button>
      )}
    </div>
  );
}

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <AccountLayout>
      <SectionHeading
        eyebrow="My Account"
        title="Account details"
        description="Your IBC account information and order contact details."
        align="left"
      />

      <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
        <div className="mb-6 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-xl font-bold text-white">
            {(user?.full_name?.trim()[0] ?? "U").toUpperCase()}
          </span>
          <div>
            <p className="font-display text-xl font-bold uppercase text-ink-900">
              {user?.full_name}
            </p>
            {user?.is_verified ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                <BadgeCheck className="h-4 w-4" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600">
                <ShieldAlert className="h-4 w-4" /> Not verified
              </span>
            )}
          </div>
        </div>

        <Detail label="Full name" value={user?.full_name ?? ""} />
        <Detail label="Email" value={user?.email ?? ""} />
        <PhoneDetail phone={user?.phone ?? null} />
        <Detail label="Account type" value={user?.role ?? ""} />
      </div>

      <div className="mt-8">
        <AddressBook />
      </div>
    </AccountLayout>
  );
}
