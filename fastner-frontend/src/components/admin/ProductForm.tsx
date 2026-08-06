"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  useCreateProduct,
  useFilterGroups,
  useUpdateProduct,
} from "@/features/catalog/queries";
import { useIndustries } from "@/features/industries/queries";
import type { Product } from "@/features/catalog/types";
import ImageUpload from "@/components/admin/ImageUpload";

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
  const { data: industries = [] } = useIndustries();

  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [shortDesc, setShortDesc] = useState(product?.short_description ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [priceB2c, setPriceB2c] = useState(
    product?.price_b2c != null ? String(product.price_b2c) : "",
  );
  const [priceB2b, setPriceB2b] = useState(
    product?.price_b2b != null ? String(product.price_b2b) : "",
  );
  const [b2bMinQty, setB2bMinQty] = useState(String(product?.b2b_min_qty ?? 1));
  const [isOutOfStock, setIsOutOfStock] = useState(
    product?.is_out_of_stock ?? false,
  );
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
  const [industryIds, setIndustryIds] = useState<string[]>(
    product?.industries.map((i) => i.id) ?? [],
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

    const parsePrice = (s: string) => {
      const n = parseFloat(s);
      return s.trim() && !Number.isNaN(n) ? n : null;
    };
    const minQty = Math.max(1, parseInt(b2bMinQty, 10) || 1);

    const payload = {
      name: name.trim(),
      sku: sku.trim() || null,
      short_description: shortDesc.trim() || null,
      description: description.trim() || null,
      specifications,
      images: cleanImages,
      price_b2c: parsePrice(priceB2c),
      price_b2b: parsePrice(priceB2b),
      b2b_min_qty: minQty,
      is_out_of_stock: isOutOfStock,
      category_ids: categoryIds,
      primary_category_id: primary,
      filter_value_ids: filterValueIds,
      industry_ids: industryIds,
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Part Number</label>
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

      {/* Pricing — same product, retail vs bulk rate */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls}>B2C price (₹)</label>
          <input
            className={inputCls}
            type="number"
            min={0}
            step="0.01"
            placeholder="Retail"
            value={priceB2c}
            onChange={(e) => setPriceB2c(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>B2B price (₹)</label>
          <input
            className={inputCls}
            type="number"
            min={0}
            step="0.01"
            placeholder="Bulk rate"
            value={priceB2b}
            onChange={(e) => setPriceB2b(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>B2B min qty</label>
          <input
            className={inputCls}
            type="number"
            min={1}
            step="1"
            value={b2bMinQty}
            onChange={(e) => setB2bMinQty(e.target.value)}
          />
        </div>
      </div>

      {/* Stock — keep the product visible but block checkout when unavailable */}
      <label className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5 text-sm">
        <input
          type="checkbox"
          checked={isOutOfStock}
          onChange={(e) => setIsOutOfStock(e.target.checked)}
          className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
        />
        <span className="font-semibold text-ink-800">Mark out of stock</span>
        <span className="text-ink-400">
          — still listed, but customers can&apos;t add it to the cart.
        </span>
      </label>

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
                className="shrink-0 rounded-lg px-2 text-ink-400 hover:bg-ink-50 hover:text-danger-600">
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
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1">
                <ImageUpload
                  value={url}
                  onChange={(v) => setImages((s) => s.map((u, j) => (j === i ? v : u)))}
                  label=""
                  folder="ibc/products"
                />
              </div>
              <button type="button" onClick={() => setImages((s) => s.filter((_, j) => j !== i))}
                className="shrink-0 rounded-lg px-2 py-2 text-ink-400 hover:bg-ink-50 hover:text-danger-600">
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

      {/* Industries served — surfaced when the industry is searched */}
      {industries.length > 0 && (
        <div>
          <label className={labelCls}>Industries served</label>
          <div className="flex flex-wrap gap-2 rounded-lg border border-ink-100 p-3">
            {industries.map((ind) => {
              const on = industryIds.includes(ind.id);
              return (
                <button
                  type="button"
                  key={ind.id}
                  onClick={() => setIndustryIds((l) => toggle(l, ind.id))}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    on
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-ink-200 text-ink-600 hover:border-ink-300"
                  }`}
                >
                  {ind.name}
                </button>
              );
            })}
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
