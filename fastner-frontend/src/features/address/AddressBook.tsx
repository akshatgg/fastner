"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";

import AddressForm from "./AddressForm";
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useUpdateAddress,
} from "./queries";
import type { Address } from "./types";

/** Render a saved address as a single readable line. */
export function formatAddressLines(a: Address): string {
  return [a.line1, a.line2, a.landmark, `${a.city}, ${a.state} ${a.pincode}`, a.country]
    .filter(Boolean)
    .join(", ");
}

function TypeBadge({ type }: { type: Address["address_type"] }) {
  return (
    <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500">
      {type}
    </span>
  );
}

export default function AddressBook() {
  const { data: addresses, isLoading } = useAddresses();
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const remove = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  // null = closed, "new" = add form, otherwise the id being edited.
  const [editing, setEditing] = useState<string | "new" | null>(null);

  const list = addresses ?? [];

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold uppercase text-ink-900">
          Your addresses
        </h2>
        {editing !== "new" && (
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500 px-3 py-2 text-sm font-bold text-brand-600 transition hover:bg-brand-50"
          >
            <Plus className="h-4 w-4" /> Add address
          </button>
        )}
      </div>

      {editing === "new" && (
        <div className="mb-6 rounded-xl border border-ink-200 bg-ink-50/50 p-4 sm:p-6">
          <p className="mb-4 font-semibold text-ink-900">New address</p>
          <AddressForm
            submitting={create.isPending}
            hideDefaultToggle={list.length === 0}
            onSubmit={(input) =>
              create.mutate(input, { onSuccess: () => setEditing(null) })
            }
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-ink-400">Loading…</p>
      ) : list.length === 0 && editing !== "new" ? (
        <div className="rounded-xl border border-dashed border-ink-200 py-12 text-center">
          <MapPin className="mx-auto h-8 w-8 text-ink-300" />
          <p className="mt-3 text-sm text-ink-500">
            No saved addresses yet. Add one to speed up checkout.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map((a) =>
            editing === a.id ? (
              <li
                key={a.id}
                className="rounded-xl border border-ink-200 bg-ink-50/50 p-4 sm:p-6"
              >
                <p className="mb-4 font-semibold text-ink-900">Edit address</p>
                <AddressForm
                  initial={a}
                  submitting={update.isPending}
                  submitLabel="Update address"
                  onSubmit={(input) =>
                    update.mutate(
                      { id: a.id, input },
                      { onSuccess: () => setEditing(null) },
                    )
                  }
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <li
                key={a.id}
                className="flex flex-col gap-3 rounded-xl border border-ink-100 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink-900">{a.full_name}</span>
                    <TypeBadge type={a.address_type} />
                    {a.is_default && (
                      <span className="inline-flex items-center gap-1 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-600">
                        <Star className="h-3 w-3 fill-brand-500 text-brand-500" />
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink-600">{formatAddressLines(a)}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    Phone: {a.phone}
                    {a.alt_phone && `, ${a.alt_phone}`}
                  </p>
                  {a.gst_number && (
                    <p className="text-xs text-ink-400">GST: {a.gst_number}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {!a.is_default && (
                    <button
                      onClick={() => setDefault.mutate(a.id)}
                      disabled={setDefault.isPending}
                      className="rounded-md px-2 py-1.5 text-xs font-semibold text-ink-500 transition hover:bg-ink-50 hover:text-brand-600"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    onClick={() => setEditing(a.id)}
                    className="rounded-md p-2 text-ink-400 transition hover:bg-ink-50 hover:text-brand-600"
                    aria-label="Edit address"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this address?")) remove.mutate(a.id);
                    }}
                    className="rounded-md p-2 text-ink-400 transition hover:bg-ink-50 hover:text-red-600"
                    aria-label="Delete address"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
