"use client";

import {
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Package,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import Modal from "@/components/ui/Modal";
import ProductForm from "@/components/admin/ProductForm";
import {
  useCategoryTree,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/features/catalog/queries";
import { leafCategories } from "@/features/catalog/tree";
import type { CategoryTreeNode } from "@/features/catalog/types";

const inputCls =
  "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500";

type CatModal =
  | { mode: "create"; parentId: string | null; parentName?: string }
  | { mode: "edit"; category: CategoryTreeNode };

export default function CategoriesPage() {
  const { data: tree = [], isLoading } = useCategoryTree();
  const [catModal, setCatModal] = useState<CatModal | null>(null);
  const [productLeafId, setProductLeafId] = useState<string | null>(null);

  const leaves = leafCategories(tree);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-ink-900">
            Categories &amp; Products
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Build the category tree. Add subcategories to any node; add products to leaf
            categories (those with no subcategories).
          </p>
        </div>
        <button
          onClick={() => setCatModal({ mode: "create", parentId: null })}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" /> Top-level category
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-3 shadow-card sm:p-4">
        {isLoading ? (
          <p className="px-3 py-8 text-center text-sm text-ink-400">Loading…</p>
        ) : tree.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-ink-400">
            No categories yet. Click “Top-level category” to start.
          </p>
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
    </div>
  );
}

function CategoryRow({
  node,
  depth,
  onAddSub,
  onEdit,
  onAddProduct,
}: {
  node: CategoryTreeNode;
  depth: number;
  onAddSub: (n: CategoryTreeNode) => void;
  onEdit: (n: CategoryTreeNode) => void;
  onAddProduct: (n: CategoryTreeNode) => void;
}) {
  const [open, setOpen] = useState(true);
  const del = useDeleteCategory();
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div
        className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-ink-50"
        style={{ paddingLeft: depth * 20 + 8 }}
      >
        {hasChildren ? (
          <button onClick={() => setOpen((o) => !o)} className="text-ink-400 hover:text-ink-700">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="inline-block w-4" />
        )}

        <span className="font-medium text-ink-900">{node.name}</span>
        {!node.is_active && (
          <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-500">
            hidden
          </span>
        )}
        {node.is_leaf && (
          <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-green-600">
            leaf
          </span>
        )}

        <div className="ml-auto flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <IconBtn title="Add subcategory" onClick={() => onAddSub(node)}>
            <FolderPlus className="h-4 w-4" />
          </IconBtn>
          {node.is_leaf && (
            <IconBtn title="Add product" onClick={() => onAddProduct(node)}>
              <Package className="h-4 w-4" />
            </IconBtn>
          )}
          <IconBtn title="Edit" onClick={() => onEdit(node)}>
            <Pencil className="h-4 w-4" />
          </IconBtn>
          <IconBtn
            title="Delete"
            danger
            onClick={() => {
              if (confirm(`Delete “${node.name}”? This can't be undone.`)) del.mutate(node.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
      </div>

      {hasChildren && open && (
        <ul>
          {node.children.map((child) => (
            <CategoryRow
              key={child.id}
              node={child}
              depth={depth + 1}
              onAddSub={onAddSub}
              onEdit={onEdit}
              onAddProduct={onAddProduct}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`rounded-md p-1.5 text-ink-400 transition hover:bg-white ${
        danger ? "hover:text-red-600" : "hover:text-brand-600"
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
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>
      <div>
        <label className={labelCls}>Description</label>
        <textarea className={inputCls} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Image URL (Cloudinary)</label>
        <input className={inputCls} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://res.cloudinary.com/..." />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Visible on storefront
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-500 hover:text-ink-800">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50">
          {busy ? "Saving…" : modal.mode === "edit" ? "Save" : "Add"}
        </button>
      </div>
    </form>
  );
}
