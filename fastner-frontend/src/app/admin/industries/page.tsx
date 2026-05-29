"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import Modal from "@/components/ui/Modal";
import {
  useCreateIndustry,
  useDeleteIndustry,
  useIndustries,
  useUpdateIndustry,
} from "@/features/industries/queries";
import type { Industry } from "@/features/industries/types";

const inputCls =
  "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500";

type IndModal = { mode: "create" } | { mode: "edit"; industry: Industry };

export default function IndustriesPage() {
  const { data: industries = [], isLoading } = useIndustries();
  const [modal, setModal] = useState<IndModal | null>(null);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-ink-900">
            Industries
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Manage the “Industries We Serve” section on the homepage. Add, edit or remove
            the sector cards shown in the carousel.
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" /> Add industry
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-3 shadow-card sm:p-4">
        {isLoading ? (
          <p className="px-3 py-8 text-center text-sm text-ink-400">Loading…</p>
        ) : industries.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-ink-400">
            No industries yet. Click “Add industry” to start. Until you add one, the
            homepage shows the default sector list.
          </p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {industries.map((ind) => (
              <IndustryRow
                key={ind.id}
                industry={ind}
                onEdit={() => setModal({ mode: "edit", industry: ind })}
              />
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit industry" : "Add industry"}
      >
        {modal && <IndustryForm modal={modal} onDone={() => setModal(null)} />}
      </Modal>
    </div>
  );
}

function IndustryRow({
  industry,
  onEdit,
}: {
  industry: Industry;
  onEdit: () => void;
}) {
  const del = useDeleteIndustry();

  return (
    <li className="group flex items-center gap-3 px-2 py-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-50">
        {industry.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={industry.image_url}
            alt={industry.name}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <span className="font-display text-lg font-bold text-ink-200">
            {industry.name.trim().charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-ink-900">{industry.name}</span>
          {!industry.is_active && (
            <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-500">
              hidden
            </span>
          )}
        </div>
        {industry.blurb && (
          <p className="truncate text-sm text-ink-500">{industry.blurb}</p>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          title="Edit"
          onClick={onEdit}
          className="rounded-md p-1.5 text-ink-400 transition hover:bg-ink-50 hover:text-brand-600"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          title="Delete"
          onClick={() => {
            if (confirm(`Delete “${industry.name}”? This can't be undone.`))
              del.mutate(industry.id);
          }}
          className="rounded-md p-1.5 text-ink-400 transition hover:bg-ink-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function IndustryForm({ modal, onDone }: { modal: IndModal; onDone: () => void }) {
  const create = useCreateIndustry();
  const update = useUpdateIndustry();
  const existing = modal.mode === "edit" ? modal.industry : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [blurb, setBlurb] = useState(existing?.blurb ?? "");
  const [imageUrl, setImageUrl] = useState(existing?.image_url ?? "");
  const [position, setPosition] = useState(String(existing?.position ?? 0));
  const [isActive, setIsActive] = useState(existing?.is_active ?? true);

  const busy = create.isPending || update.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const body = {
      name: name.trim(),
      blurb: blurb.trim() || null,
      image_url: imageUrl.trim() || null,
      position: Number(position) || 0,
      is_active: isActive,
    };
    if (modal.mode === "edit") {
      await update.mutateAsync({ id: existing!.id, input: body });
    } else {
      await create.mutateAsync(body);
    }
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={labelCls}>Name *</label>
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div>
        <label className={labelCls}>Blurb</label>
        <textarea
          className={inputCls}
          rows={2}
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
          placeholder="One line on how fasteners serve this sector."
        />
      </div>
      <div>
        <label className={labelCls}>Image URL</label>
        <input
          className={inputCls}
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="/assets/industries/aerospace.png or https://…"
        />
      </div>
      <div className="flex items-end gap-4">
        <div className="w-28">
          <label className={labelCls}>Order</label>
          <input
            className={inputCls}
            type="number"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Visible on storefront
        </label>
      </div>
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
          {busy ? "Saving…" : modal.mode === "edit" ? "Save" : "Add"}
        </button>
      </div>
    </form>
  );
}
