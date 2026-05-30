"use client";

import { Building2, User } from "lucide-react";

import { useModeStore, type Mode } from "@/lib/store/mode-store";

const OPTIONS: { value: Mode; label: string; Icon: typeof User }[] = [
  { value: "b2c", label: "Retail", Icon: User },
  { value: "b2b", label: "Bulk / B2B", Icon: Building2 },
];

/** Segmented B2C/B2B switch.
 *
 * Uncontrolled (default): reads and writes the global mode store — use on the
 * storefront. Controlled: pass `value` + `onChange` to drive it from elsewhere
 * (e.g. the cart page, which syncs the server cart's mode). */
export default function ModeToggle({
  value,
  onChange,
  size = "md",
  className = "",
}: {
  value?: Mode;
  onChange?: (mode: Mode) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const storeMode = useModeStore((s) => s.mode);
  const setStoreMode = useModeStore((s) => s.setMode);
  const mode = value ?? storeMode;

  const select = (m: Mode) => (onChange ? onChange(m) : setStoreMode(m));

  const pad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm";

  return (
    <div
      className={`inline-flex rounded-lg border border-ink-200 bg-ink-50 p-0.5 ${className}`}
      role="group"
      aria-label="Pricing mode"
    >
      {OPTIONS.map(({ value: v, label, Icon }) => {
        const active = mode === v;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={active}
            onClick={() => select(v)}
            className={`inline-flex items-center gap-1.5 rounded-md font-bold transition ${pad} ${
              active
                ? "bg-white text-brand-600 shadow-sm"
                : "text-ink-500 hover:text-ink-800"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
