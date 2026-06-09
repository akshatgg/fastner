"use client";

import {
  Box,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  GripVertical,
  ImageOff,
  Layers,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import Modal from "@/components/ui/Modal";
import ProductForm from "@/components/admin/ProductForm";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  useAdminCategoryProducts,
  useCategoryTree,
  useCreateCategory,
  useDeleteCategory,
  useDeleteProduct,
  useReorderProducts,
  useUpdateCategory,
} from "@/features/catalog/queries";
import { leafCategories } from "@/features/catalog/tree";
import type { CategoryTreeNode, Product } from "@/features/catalog/types";
import { formatPrice } from "@/lib/format";

const inputCls =
  "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500";

type CatModal =
  | { mode: "create"; parentId: string | null; parentName?: string }
  | { mode: "edit"; category: CategoryTreeNode };

function countNodes(nodes: CategoryTreeNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countNodes(n.children), 0);
}

export default function CategoriesPage() {
  const { data: tree = [], isLoading } = useCategoryTree();
  const [catModal, setCatModal] = useState<CatModal | null>(null);
  const [productLeafId, setProductLeafId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const leaves = leafCategories(tree);
  const total = countNodes(tree);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Layers className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold uppercase text-ink-900">
              Categories &amp; Products
            </h1>
            <p className="mt-1 max-w-xl text-sm text-ink-500">
              Build your catalog tree. Add subcategories to any folder, and add
              products to{" "}
              <span className="font-semibold text-ink-700">leaf categories</span>{" "}
              (the ones with no subcategories).
            </p>
          </div>
        </div>
        <button
          onClick={() => setCatModal({ mode: "create", parentId: null })}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" /> New category
        </button>
      </div>

      {/* Legend / count bar */}
      {!isLoading && tree.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-ink-100 bg-ink-50/60 px-4 py-2.5 text-xs text-ink-500">
          <span className="font-semibold text-ink-700">{total} categories</span>
          <span className="flex items-center gap-1.5">
            <Folder className="h-3.5 w-3.5 text-brand-500" /> folder = has
            subcategories
          </span>
          <span className="flex items-center gap-1.5">
            <Box className="h-3.5 w-3.5 text-success-600" /> leaf = holds products
          </span>
          <span className="ml-auto hidden items-center gap-1.5 sm:flex">
            <GripVertical className="h-3.5 w-3.5" /> drag products to reorder
          </span>
        </div>
      )}

      {/* Tree */}
      <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-2 shadow-card sm:p-3">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-ink-50" />
            ))}
          </div>
        ) : tree.length === 0 ? (
          <div className="flex flex-col items-center px-3 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
              <FolderPlus className="h-7 w-7" />
            </span>
            <p className="mt-4 font-semibold text-ink-800">No categories yet</p>
            <p className="mt-1 max-w-sm text-sm text-ink-500">
              Start by adding a top-level category like “Fasteners” or “Tools”,
              then nest subcategories inside it.
            </p>
            <button
              onClick={() => setCatModal({ mode: "create", parentId: null })}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" /> Add your first category
            </button>
          </div>
        ) : (
          <ul>
            {tree.map((node) => (
              <CategoryRow
                key={node.id}
                node={node}
                depth={0}
                onAddSub={(n) =>
                  setCatModal({ mode: "create", parentId: n.id, parentName: n.name })
                }
                onEdit={(n) => setCatModal({ mode: "edit", category: n })}
                onAddProduct={(n) => setProductLeafId(n.id)}
                onEditProduct={setEditProduct}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Category create / edit */}
      <Modal
        open={catModal !== null}
        onClose={() => setCatModal(null)}
        title={
          catModal?.mode === "edit"
            ? "Edit category"
            : catModal?.parentName
              ? `Add subcategory in “${catModal.parentName}”`
              : "Add top-level category"
        }
      >
        {catModal && (
          <CategoryForm modal={catModal} onDone={() => setCatModal(null)} />
        )}
      </Modal>

      {/* Add product */}
      <Modal
        open={productLeafId !== null}
        onClose={() => setProductLeafId(null)}
        title="Add product"
        widthClass="max-w-2xl"
      >
        {productLeafId && (
          <ProductForm
            leaves={leaves}
            defaultCategoryId={productLeafId}
            onDone={() => setProductLeafId(null)}
          />
        )}
      </Modal>

      {/* Edit product */}
      <Modal
        open={editProduct !== null}
        onClose={() => setEditProduct(null)}
        title="Edit product"
        widthClass="max-w-2xl"
      >
        {editProduct && (
          <ProductForm
            leaves={leaves}
            product={editProduct}
            onDone={() => setEditProduct(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function CategoryRow({
  node,
  depth,
  onAddSub,
  onEdit,
  onAddProduct,
  onEditProduct,
}: {
  node: CategoryTreeNode;
  depth: number;
  onAddSub: (n: CategoryTreeNode) => void;
  onEdit: (n: CategoryTreeNode) => void;
  onAddProduct: (n: CategoryTreeNode) => void;
  onEditProduct: (p: Product) => void;
}) {
  const [open, setOpen] = useState(true);
  const del = useDeleteCategory();
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div
        className="group relative flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-ink-50"
        style={{ paddingLeft: depth * 22 + 8 }}
      >
        {/* expand / collapse */}
        {hasChildren ? (
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex h-5 w-5 items-center justify-center rounded text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          >
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="inline-block w-5" />
        )}

        {/* thumbnail / icon */}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-50 ring-1 ring-ink-100">
          {node.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={node.image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : hasChildren ? (
            open ? (
              <FolderOpen className="h-4.5 w-4.5 text-brand-500" />
            ) : (
              <Folder className="h-4.5 w-4.5 text-brand-500" />
            )
          ) : (
            <Box className="h-4.5 w-4.5 text-success-600" />
          )}
        </span>

        {/* name + meta */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-ink-900">{node.name}</span>
            {!node.is_active && (
              <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-500">
                hidden
              </span>
            )}
            {node.is_leaf && (
              <span className="rounded bg-success-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-success-600">
                leaf
              </span>
            )}
          </div>
          {hasChildren && (
            <span className="text-xs text-ink-400">
              {node.children.length} subcategor
              {node.children.length === 1 ? "y" : "ies"}
            </span>
          )}
        </div>

        {/* actions — subtle until hover */}
        <div className="ml-auto flex items-center gap-1 opacity-60 transition group-hover:opacity-100">
          <IconBtn title="Add subcategory" onClick={() => onAddSub(node)}>
            <FolderPlus className="h-4 w-4" />
          </IconBtn>
          {node.is_leaf && (
            <IconBtn
              title="Add product"
              accent
              onClick={() => onAddProduct(node)}
            >
              <PackagePlus className="h-4 w-4" />
            </IconBtn>
          )}
          <IconBtn title="Edit category" onClick={() => onEdit(node)}>
            <Pencil className="h-4 w-4" />
          </IconBtn>
          <IconBtn
            title="Delete category"
            danger
            onClick={() => {
              if (confirm(`Delete “${node.name}”? This can't be undone.`))
                del.mutate(node.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
      </div>

      {node.is_leaf && (
        <LeafProductList
          node={node}
          depth={depth}
          onAddProduct={onAddProduct}
          onEditProduct={onEditProduct}
        />
      )}

      {hasChildren && open && (
        <ul className="relative">
          {/* vertical guide line for nested items */}
          <span
            aria-hidden
            className="absolute inset-y-0 w-px bg-ink-100"
            style={{ left: depth * 22 + 18 }}
          />
          {node.children.map((child) => (
            <CategoryRow
              key={child.id}
              node={child}
              depth={depth + 1}
              onAddSub={onAddSub}
              onEdit={onEdit}
              onAddProduct={onAddProduct}
              onEditProduct={onEditProduct}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function LeafProductList({
  node,
  depth,
  onAddProduct,
  onEditProduct,
}: {
  node: CategoryTreeNode;
  depth: number;
  onAddProduct: (n: CategoryTreeNode) => void;
  onEditProduct: (p: Product) => void;
}) {
  const { data, isLoading } = useAdminCategoryProducts(node.id);
  const del = useDeleteProduct();
  const reorder = useReorderProducts();
  const pad = (depth + 1) * 22 + 20;

  // Local copy so drag reordering feels instant; resynced when the query refetches.
  const [items, setItems] = useState<Product[]>([]);
  const dragFrom = useRef<number | null>(null);

  // Depend on a stable key, not the array reference, to avoid an update loop.
  const serverKey = (data?.items ?? []).map((p) => p.id).join(",");
  useEffect(() => {
    setItems(data?.items ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  if (isLoading) {
    return (
      <p className="py-1.5 text-xs text-ink-400" style={{ paddingLeft: pad }}>
        Loading products…
      </p>
    );
  }
  if (items.length === 0) {
    return (
      <div
        className="flex items-center gap-2 py-1.5 text-xs text-ink-300"
        style={{ paddingLeft: pad }}
      >
        <ImageOff className="h-3.5 w-3.5" />
        <span>No products yet —</span>
        <button
          onClick={() => onAddProduct(node)}
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          add one
        </button>
      </div>
    );
  }

  const onDragOver = (e: React.DragEvent, over: number) => {
    e.preventDefault();
    const from = dragFrom.current;
    if (from === null || from === over) return;
    setItems((cur) => {
      const next = [...cur];
      const [moved] = next.splice(from, 1);
      next.splice(over, 0, moved);
      return next;
    });
    dragFrom.current = over;
  };

  const commit = () => {
    if (dragFrom.current === null) return;
    dragFrom.current = null;
    reorder.mutate(items.map((p) => p.id));
  };

  return (
    <ul className="mb-1">
      {items.map((p, i) => (
        <li
          key={p.id}
          draggable
          onDragStart={() => (dragFrom.current = i)}
          onDragOver={(e) => onDragOver(e, i)}
          onDrop={commit}
          onDragEnd={commit}
          className="group/prod flex items-center gap-2 rounded-lg py-1.5 pr-2 transition hover:bg-brand-50/40"
          style={{ paddingLeft: pad }}
        >
          <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-ink-300 transition active:cursor-grabbing group-hover/prod:text-ink-400" />

          {/* thumbnail */}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-ink-50 ring-1 ring-ink-100">
            {p.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
            ) : (
              <Package className="h-4 w-4 text-ink-300" />
            )}
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-ink-800">
                {p.name}
              </span>
              {!p.is_active && (
                <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-500">
                  hidden
                </span>
              )}
            </div>
            {p.sku && <span className="text-xs text-ink-400">SKU: {p.sku}</span>}
          </div>

          <span className="ml-auto whitespace-nowrap text-sm font-semibold text-ink-700">
            {formatPrice(p.price_b2c)}
          </span>

          <button
            title="Edit product"
            onClick={() => onEditProduct(p)}
            className="rounded-md p-1.5 text-ink-400 opacity-100 transition hover:bg-white hover:text-brand-600 sm:opacity-0 sm:group-hover/prod:opacity-100"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            title="Delete product"
            onClick={() => {
              if (confirm(`Delete “${p.name}”? This can't be undone.`))
                del.mutate(p.id);
            }}
            className="rounded-md p-1.5 text-ink-400 opacity-100 transition hover:bg-white hover:text-danger-600 sm:opacity-0 sm:group-hover/prod:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  danger,
  accent,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`rounded-md p-1.5 transition hover:bg-white ${
        danger
          ? "text-ink-400 hover:text-danger-600"
          : accent
            ? "text-brand-500 hover:text-brand-700"
            : "text-ink-400 hover:text-brand-600"
      }`}
    >
      {children}
    </button>
  );
}

function CategoryForm({ modal, onDone }: { modal: CatModal; onDone: () => void }) {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const existing = modal.mode === "edit" ? modal.category : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [imageUrl, setImageUrl] = useState(existing?.image_url ?? "");
  const [isActive, setIsActive] = useState(existing?.is_active ?? true);

  const busy = create.isPending || update.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      is_active: isActive,
    };
    if (modal.mode === "edit") {
      await update.mutateAsync({ id: existing!.id, input: body });
    } else {
      await create.mutateAsync({ ...body, parent_id: modal.parentId });
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
        <label className={labelCls}>Description</label>
        <textarea
          className={inputCls}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <ImageUpload
        value={imageUrl}
        onChange={setImageUrl}
        label="Image"
        folder="ibc/categories"
      />
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Visible on storefront
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
          {busy ? "Saving…" : modal.mode === "edit" ? "Save" : "Add"}
        </button>
      </div>
    </form>
  );
}
