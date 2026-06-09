"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

/** Lightweight centered modal with a backdrop. */
export default function Modal({
  open,
  onClose,
  title,
  children,
  widthClass = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  widthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/50 p-3 py-6 sm:p-4 sm:py-10">
      <div
        className={`w-full ${widthClass} rounded-2xl bg-white shadow-lift`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-4 sm:px-6">
          <h2 className="font-display text-lg font-bold uppercase text-ink-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-50 hover:text-ink-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-4 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
