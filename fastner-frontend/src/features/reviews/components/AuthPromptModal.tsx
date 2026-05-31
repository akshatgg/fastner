"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star, X } from "lucide-react";

/** Popup shown when a signed-out visitor tries to write a review: invites them
 *  to sign in or create an account, returning here afterwards. */
export default function AuthPromptModal({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const next = encodeURIComponent(pathname ?? "/");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-md p-1.5 text-ink-400 transition hover:bg-ink-50 hover:text-ink-700"
        >
          <X className="h-5 w-5" />
        </button>

        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Star className="h-6 w-6" />
        </span>
        <h3 className="mt-4 font-display text-xl font-bold uppercase text-ink-900">
          Sign in to review
        </h3>
        <p className="mt-1 text-sm text-ink-500">
          Please sign in or create an account to share your review of this product.
        </p>

        <div className="mt-6 space-y-2">
          <Link
            href={`/sign-in?next=${next}`}
            className="block w-full rounded-lg bg-brand-500 px-5 py-2.5 text-center text-sm font-bold text-white transition hover:bg-brand-600"
          >
            Sign in
          </Link>
          <Link
            href={`/sign-up?next=${next}`}
            className="block w-full rounded-lg border border-ink-200 px-5 py-2.5 text-center text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
