"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

import { useSearchCatalog } from "@/features/catalog/queries";
import { formatPrice } from "@/lib/format";

/** Full-screen type-ahead product search. Opening focuses the input; results
 *  stream in as you type (debounced). The left column lists the top product
 *  matches with thumbnails; hovering a row shows its detail on the right. */
export default function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the term so we don't fire a request on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 200);
    return () => clearTimeout(id);
  }, [term]);

  // Focus the field and lock body scroll while the overlay is open; reset the
  // query each time it closes so the next open starts clean.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
    document.body.style.overflow = "";
    setTerm("");
    setDebounced("");
    setActiveId(null);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const { data, isFetching } = useSearchCatalog(debounced, 5);
  const trimmed = debounced.trim();
  const hasQuery = trimmed.length >= 2;
  const products = data?.products ?? [];
  const noResults = hasQuery && !isFetching && products.length === 0;

  // The previewed product: whichever row is hovered, else the first result.
  const active =
    products.find((p) => p.id === activeId) ?? products[0] ?? null;

  const goToAll = () => {
    const q = term.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative mx-auto mt-16 w-full max-w-3xl px-4 sm:mt-20">
        {/* Search field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goToAll();
          }}
          className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lift"
        >
          <Search className="h-5 w-5 shrink-0 text-ink-400" />
          <input
            ref={inputRef}
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search products…"
            className="w-full bg-transparent text-base text-ink-900 placeholder:text-ink-400 focus:outline-none"
            aria-label="Search"
          />
          {isFetching && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink-300" />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="shrink-0 rounded-md p-1 text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-800"
          >
            <X className="h-5 w-5" />
          </button>
        </form>

        {/* Results: list (left) + detail preview (right) */}
        {hasQuery && (
          <div className="mt-2 overflow-hidden rounded-xl bg-white shadow-lift">
            {noResults ? (
              <p className="px-4 py-10 text-center text-sm text-ink-400">
                No products match “{trimmed}”.
              </p>
            ) : (
              <div className="flex">
                {/* List */}
                <div className="max-h-[70vh] w-full overflow-y-auto py-2 md:w-3/5 md:border-r md:border-ink-50">
                  <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                    Products
                  </p>
                  {products.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      onClick={onClose}
                      onMouseEnter={() => setActiveId(p.id)}
                      onFocus={() => setActiveId(p.id)}
                      className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                        active?.id === p.id ? "bg-ink-50" : "hover:bg-ink-50"
                      }`}
                    >
                      <Thumb src={p.image_url} alt={p.name} />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink-800">
                        {p.name}
                      </span>
                      {p.price_b2c != null && (
                        <span className="shrink-0 text-sm font-semibold text-ink-900">
                          {formatPrice(p.price_b2c)}
                        </span>
                      )}
                    </Link>
                  ))}

                  <button
                    type="button"
                    onClick={goToAll}
                    className="mt-1 block w-full border-t border-ink-50 px-4 py-3 text-left text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
                  >
                    Show all results for “{trimmed}”
                  </button>
                </div>

                {/* Detail preview */}
                {active && (
                  <div className="hidden w-2/5 flex-col p-5 md:flex">
                    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-ink-50">
                      {active.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={active.image_url}
                          alt={active.name}
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <span className="font-display text-5xl font-bold text-ink-200">
                          {active.name.trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 text-sm font-semibold leading-snug text-ink-900">
                      {active.name}
                    </h3>
                    {active.price_b2c != null && (
                      <p className="mt-1 text-lg font-bold text-ink-900">
                        {formatPrice(active.price_b2c)}
                      </p>
                    )}
                    {(active.short_description || active.description) && (
                      <p className="mt-3 line-clamp-4 text-xs leading-relaxed text-ink-500">
                        {active.short_description || active.description}
                      </p>
                    )}
                    <Link
                      href={`/product/${active.slug}`}
                      onClick={onClose}
                      className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700"
                    >
                      See details →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** A square thumbnail that falls back to the first letter when no image. */
function Thumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-ink-50">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-contain p-1"
          loading="lazy"
        />
      ) : (
        <span className="font-display text-base font-bold text-ink-300">
          {alt.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}
