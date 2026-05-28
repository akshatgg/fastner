"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  useCreateProduct,
  useFilterGroups,
  useUpdateProduct,
} from "@/features/catalog/queries";
import type { Product } from "@/features/catalog/types";

const inputCls =
  "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500";

type SpecRow = { key: string; value: string };

export default function ProductForm({
  leaves,
  defaultCategoryId,
  product,
  onDone,
}: {
  leaves: { id: string; label: string }[];
  defaultCategoryId?: string;
  product?: Product;
  onDone: () => void;
}) {
  const editing = Boolean(product);
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const { data: groups = [] } = useFilterGroups();

  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [shortDesc, setShortDesc] = useState(product?.short_description ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? [""]);
  const [specs, setSpecs] = useState<SpecRow[]>(
    product
      ? Object.entries(product.specifications).map(([key, value]) => ({
          key,
          value: String(value),
        }))
      : [{ key: "", value: "" }],
  );
  const [categoryIds, setCategoryIds] = useState<string[]>(
    product
      ? product.categories.map((c) => c.category_id)
      : defaultCategoryId
        ? [defaultCategoryId]
        : [],
  );
  const [primaryId, setPrimaryId] = useState<string | null>(
    product?.categories.find((c) => c.is_primary)?.category_id ??
      defaultCategoryId ??
      null,
  );
  const [filterValueIds, setFilterValueIds] = useState<string[]>(
    product?.filter_values.map((f) => f.id) ?? [],
  );

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (categoryIds.length === 0) return;

    const specifications: Record<string, string> = {};
    for (const { key, value } of specs) {
      if (key.trim()) specifications[key.trim()] = value;
    }
    const cleanImages = images.map((s) => s.trim()).filter(Boolean);
    const primary =
      primaryId && categoryIds.includes(primaryId) ? primaryId : categoryIds[0];

    const payload = {
      name: name.trim(),
      sku: sku.trim() || null,
      short_description: shortDesc.trim() || null,
      description: description.trim() || null,
      specifications,
      images: cleanImages,
      category_ids: categoryIds,
      primary_category_id: primary,
      filter_value_ids: filterValueIds,
    };

    if (editing && product) {
      await update.mutateAsync({ id: product.id, input: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onDone();
  };

  const busy = create.isPending || update.isPending;

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className={labelCls}>Name *</label>
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>SKU</label>
          <input className={inputCls} value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Short description</label>
          <input className={inputCls} value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea className={inputCls} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      {/* Specifications (JSONB) */}
      <div>
        <label className={labelCls}>Specifications</label>
        <div className="space-y-2">
          {specs.map((row, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputCls}
                placeholder="e.g. material"
                value={row.key}
                onChange={(e) =>
                  setSpecs((s) => s.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))
                }
              />
              <input
                className={inputCls}
                placeholder="e.g. SS304"
                value={row.value}
                onChange={(e) =>
                  setSpecs((s) => s.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))
                }
              />
              <button type="button" onClick={() => setSpecs((s) => s.filter((_, j) => j !== i))}
                className="shrink-0 rounded-lg px-2 text-ink-400 hover:bg-ink-50 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setSpecs((s) => [...s, { key: "", value: "" }])}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
            <Plus className="h-4 w-4" /> Add spec
          </button>
        </div>
      </div>

      {/* Images (Cloudinary URLs) */}
      <div>
        <label className={labelCls}>Image URLs (Cloudinary)</label>
        <div className="space-y-2">
          {images.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputCls}
                placeholder="https://res.cloudinary.com/..."
                value={url}
                onChange={(e) => setImages((s) => s.map((u, j) => (j === i ? e.target.value : u)))}
              />
              <button type="button" onClick={() => setImages((s) => s.filter((_, j) => j !== i))}
                className="shrink-0 rounded-lg px-2 text-ink-400 hover:bg-ink-50 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setImages((s) => [...s, ""])}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
            <Plus className="h-4 w-4" /> Add image
          </button>
        </div>
      </div>

      {/* Categories (leaf only) */}
      <div>
        <label className={labelCls}>Categories (leaf only) — pick one or more *</label>
        <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-ink-100 p-3">
          {leaves.length === 0 && (
            <p className="text-sm text-ink-400">No leaf categories yet — create a subcategory first.</p>
          )}
          {leaves.map((leaf) => {
            const checked = categoryIds.includes(leaf.id);
            return (
              <div key={leaf.id} className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-ink-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setCategoryIds((l) => toggle(l, leaf.id));
                      if (primaryId === leaf.id) setPrimaryId(null);
                    }}
                  />
                  {leaf.label}
                </label>
                {checked && (
                  <label className="flex items-center gap-1 text-xs text-ink-400">
                    <input
                      type="radio"
                      name="primary"
                      checked={primaryId === leaf.id}
                      onChange={() => setPrimaryId(leaf.id)}
                    />
                    primary
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter values */}
      {groups.length > 0 && (
        <div>
          <label className={labelCls}>Filters</label>
          <div className="space-y-3 rounded-lg border border-ink-100 p-3">
            {groups.map((g) => (
              <div key={g.id}>
                <p className="text-xs font-semibold text-ink-600">{g.name}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {g.values.length === 0 && (
                    <span className="text-xs text-ink-400">no values</span>
                  )}
                  {g.values.map((v) => {
                    const on = filterValueIds.includes(v.id);
                    return (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => setFilterValueIds((l) => toggle(l, v.id))}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          on
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-ink-200 text-ink-600 hover:border-ink-300"
                        }`}
                      >
                        {v.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onDone}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-500 hover:text-ink-800">
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || categoryIds.length === 0}
          className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {busy ? "Saving…" : editing ? "Save changes" : "Add product"}
        </button>
      </div>
    </form>
  );
}
