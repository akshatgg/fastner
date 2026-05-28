"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  useCreateFilterGroup,
  useCreateFilterValue,
  useDeleteFilterGroup,
  useDeleteFilterValue,
  useFilterGroups,
} from "@/features/catalog/queries";
import type { FilterGroupWithValues } from "@/features/catalog/types";

const inputCls =
  "rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default function FiltersPage() {
  const { data: groups = [], isLoading } = useFilterGroups();
  const createGroup = useCreateFilterGroup();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");

  const addGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createGroup.mutateAsync({ name: name.trim(), unit: unit.trim() || null });
    setName("");
    setUnit("");
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold uppercase text-ink-900">Filters</h1>
      <p className="mt-1 text-sm text-ink-500">
        Define filter dimensions (e.g. Material, Thread Size, Length) and the values inside
        each. These power the storefront filter sidebar.
      </p>

      <form
        onSubmit={addGroup}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card"
      >
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
            New filter group
          </label>
          <input
            className={`${inputCls} w-full`}
            placeholder="e.g. Material"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <input
          className={`${inputCls} w-32`}
          placeholder="unit (opt)"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />
        <button
          type="submit"
          disabled={createGroup.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add group
        </button>
      </form>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <p className="text-center text-sm text-ink-400">Loading…</p>
        ) : groups.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink-200 py-10 text-center text-sm text-ink-400">
            No filter groups yet.
          </p>
        ) : (
          groups.map((g) => <GroupCard key={g.id} group={g} />)
        )}
      </div>
    </div>
  );
}

function GroupCard({ group }: { group: FilterGroupWithValues }) {
  const createValue = useCreateFilterValue();
  const deleteValue = useDeleteFilterValue();
  const deleteGroup = useDeleteFilterGroup();
  const [value, setValue] = useState("");

  const addValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    await createValue.mutateAsync({ filter_group_id: group.id, value: value.trim() });
    setValue("");
  };

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink-900">
          {group.name}
          {group.unit && <span className="ml-2 text-xs font-normal text-ink-400">({group.unit})</span>}
        </h3>
        <button
          onClick={() => {
            if (confirm(`Delete the “${group.name}” group and all its values?`))
              deleteGroup.mutate(group.id);
          }}
          className="rounded-md p-1.5 text-ink-400 transition hover:bg-ink-50 hover:text-red-600"
          title="Delete group"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {group.values.length === 0 && (
          <span className="text-sm text-ink-400">No values yet.</span>
        )}
        {group.values.map((v) => (
          <span
            key={v.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 py-1 pl-3 pr-1.5 text-sm text-ink-700"
          >
            {v.value}
            <button
              onClick={() => deleteValue.mutate(v.id)}
              className="rounded-full p-0.5 text-ink-300 hover:bg-ink-50 hover:text-red-600"
              title="Remove value"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>

      <form onSubmit={addValue} className="mt-3 flex gap-2">
        <input
          className={`${inputCls} flex-1`}
          placeholder="Add a value, e.g. SS304"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="submit"
          disabled={createValue.isPending}
          className="rounded-lg border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-400 hover:text-brand-600 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
