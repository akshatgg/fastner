"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  Phone,
  Mail,
  Search,
  ShoppingCart,
  User,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Package,
  MapPin,
} from "lucide-react";
import { LOGOS, NAV_LINKS, SITE } from "@/lib/site-data";
import { useSearchCatalog } from "@/features/catalog/queries";
import { formatPrice } from "@/lib/format";
import { useAuthStore } from "@/lib/store/auth-store";
import { useLogout } from "@/features/auth/queries";
import { useCartCount } from "@/features/cart/queries";
import { useAddresses } from "@/features/address/queries";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  // Gate auth-dependent UI behind mount so the persisted store doesn't cause a
  // server/client hydration mismatch (server always renders the logged-out view).
  const [mounted, setMounted] = useState(false);

  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const cartCount = useCartCount();

  const isAuthed = mounted && Boolean(accessToken);
  const isAdmin =
    isAuthed && (user?.role === "admin" || user?.role === "superadmin");
  const firstName = user?.full_name?.trim().split(/\s+/)[0] ?? "Account";
  const initials = (user?.full_name?.trim()[0] ?? "U").toUpperCase();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      {/* Row 1 — logo, search bar, cart & account */}
      <div
        className={[
          "border-b transition-all duration-200",
          scrolled
            ? "border-ink-100 bg-white/95 shadow-sm backdrop-blur"
            : "border-transparent bg-white",
        ].join(" ")}
      >
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <a href="/" className="flex shrink-0 items-center">
              <Image
                src={LOGOS.dark}
                alt={`${SITE.name} — ${SITE.tagline}`}
                width={LOGOS.width}
                height={LOGOS.height}
                priority
                className="h-12 w-auto sm:h-14"
              />
            </a>
            {mounted && isAuthed && <DeliveryLocation />}

            {/* Search bar — inline on tablet/desktop */}
            <HeaderSearch className="mx-auto hidden max-w-2xl flex-1 md:flex" />

            {/* Account / cart actions */}
            <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
              <a
                href="/cart"
                aria-label="Cart"
                className="relative inline-flex items-center gap-2 rounded-md p-2.5 text-ink-700 transition-colors hover:bg-ink-50 hover:text-brand-600"
              >
                <span className="relative">
                  <ShoppingCart className="h-6 w-6" />
                  {mounted && cartCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold leading-none text-white">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </span>
                <span className="hidden text-sm font-semibold sm:inline">
                  Cart
                </span>
              </a>

              {isAuthed ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((v) => !v)}
                    aria-label="Account menu"
                    aria-expanded={profileOpen}
                    className="inline-flex items-center gap-1.5 rounded-md p-1.5 text-ink-700 transition-colors hover:bg-ink-50 sm:gap-2 sm:py-1.5 sm:pl-1.5 sm:pr-2.5"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                      {initials}
                    </span>
                    <span className="hidden text-sm font-semibold text-ink-800 sm:inline">
                      {firstName}
                    </span>
                    <ChevronDown
                      className={`hidden h-4 w-4 text-ink-500 transition-transform sm:inline ${profileOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {profileOpen && (
                    <>
                      {/* click-catcher to close on outside click */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileOpen(false)}
                      />
                      <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-ink-100 bg-white py-1 shadow-lg">
                        <div className="border-b border-ink-50 px-4 py-3">
                          <p className="truncate text-sm font-semibold text-ink-900">
                            {user?.full_name}
                          </p>
                          {user?.email && (
                            <p className="truncate text-xs text-ink-500">
                              {user.email}
                            </p>
                          )}
                        </div>
                        {isAdmin && (
                          <a
                            href="/admin"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 border-b border-ink-50 px-4 py-2.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Admin dashboard
                          </a>
                        )}
                        <a
                          href="/account"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-50 hover:text-brand-600"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </a>
                        <a
                          href="/orders"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 hover:text-brand-600"
                        >
                          <Package className="h-4 w-4" />
                          My orders
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            logout.mutate();
                          }}
                          className="flex w-full items-center gap-2.5 border-t border-ink-50 px-4 py-2.5 text-left text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <a
                  href="/sign-in"
                  className="inline-flex items-center gap-2 rounded-md p-2.5 text-ink-700 transition-colors hover:bg-ink-50 hover:text-brand-600"
                >
                  <User className="h-6 w-6" />
                  <span className="hidden text-sm font-semibold sm:inline">
                    Sign in
                  </span>
                </a>
              )}

              {/* Mobile toggle */}
              <button
                type="button"
                aria-label="Toggle menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center justify-center rounded-md p-2.5 text-ink-800 lg:hidden"
              >
                {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
              </button>
            </div>
          </div>

          {/* Search bar — full-width row on mobile */}
          <HeaderSearch className="mt-3 md:hidden" />
        </div>
      </div>

      {/* Row 2 — primary nav (left) + contact (right). Desktop only; mobile uses the drawer. */}
      <div className="hidden border-b border-white/5 bg-ink-950 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-3 text-sm font-semibold uppercase tracking-wide text-ink-200 transition-colors first:pl-0 hover:text-brand-400"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-6 text-sm text-ink-300">
            <a
              href={SITE.phoneHref}
              className="flex items-center gap-2 transition-colors hover:text-white"
            >
              <Phone className="h-4 w-4 text-brand-500" />
              {SITE.phone}
            </a>
            <a
              href={SITE.emailHref}
              className="flex items-center gap-2 transition-colors hover:text-white"
            >
              <Mail className="h-4 w-4 text-brand-500" />
              {SITE.email}
            </a>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden">
          <div
            className="absolute inset-x-0 top-full h-screen bg-ink-950/40"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute inset-x-0 top-full origin-top border-b border-ink-100 bg-white px-4 pb-6 pt-2 shadow-lg sm:px-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block border-b border-ink-50 py-3 text-lg font-semibold text-ink-800"
              >
                {link.label}
              </a>
            ))}
            {isAuthed ? (
              <div className="mt-4 border-t border-ink-50 pt-4">
                <div className="flex items-center gap-3 pb-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">
                      {user?.full_name}
                    </p>
                    {user?.email && (
                      <p className="truncate text-sm text-ink-500">{user.email}</p>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <a
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 py-3 text-lg font-semibold text-brand-600"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Admin dashboard
                  </a>
                )}
                <a
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 py-3 text-lg font-semibold text-ink-800"
                >
                  <LayoutDashboard className="h-5 w-5 text-ink-500" />
                  Dashboard
                </a>
                <a
                  href="/orders"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 py-3 text-lg font-semibold text-ink-800"
                >
                  <Package className="h-5 w-5 text-ink-500" />
                  My orders
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout.mutate();
                  }}
                  className="flex w-full items-center gap-2.5 py-3 text-left text-lg font-semibold text-danger-600"
                >
                  <LogOut className="h-5 w-5" />
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <a
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className="mt-4 flex items-center justify-center gap-2 rounded-md bg-brand-500 px-5 py-3 text-sm font-semibold text-white"
                >
                  <User className="h-4 w-4" />
                  Sign in
                </a>
                <a
                  href="/sign-up"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center justify-center rounded-md border border-ink-200 px-5 py-3 text-sm font-semibold text-ink-800"
                >
                  Create an account
                </a>
              </>
            )}
            <div className="mt-4 space-y-2 text-sm text-ink-500">
              <a href={SITE.phoneHref} className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-500" />
                {SITE.phone}
              </a>
              <a href={SITE.emailHref} className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-500" />
                {SITE.email}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/** Rounded search field with a live type-ahead dropdown. As you type, the top
 *  product matches (thumbnail + name + price) appear below the bar; submitting
 *  or "Show all results" navigates to the full search results page. */
function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce the term so we don't fire a request on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 200);
    return () => clearTimeout(id);
  }, [term]);

  // Close the dropdown when clicking outside the search field.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const { data, isFetching } = useSearchCatalog(debounced, 5);
  const trimmed = debounced.trim();
  const hasQuery = trimmed.length >= 2;
  const products = data?.products ?? [];
  const showDropdown = open && hasQuery;
  const noResults = hasQuery && !isFetching && products.length === 0;

  const submit = (q: string) => {
    const query = q.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setOpen(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(term);
      }}
      className={className}
      role="search"
    >
      <div ref={containerRef} className="relative flex w-full items-center">
        <Search className="pointer-events-none absolute left-4 h-5 w-5 text-ink-400" />
        <input
          type="search"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="What are you looking for today?"
          aria-label="Search products"
          className="w-full rounded-full border border-ink-200 bg-ink-50 py-2.5 pl-11 pr-14 text-sm text-ink-900 transition-colors placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-1.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Type-ahead suggestions */}
        {showDropdown && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-ink-100 bg-white py-1.5 shadow-lift">
            {noResults ? (
              <p className="px-4 py-6 text-center text-sm text-ink-400">
                No products match “{trimmed}”.
              </p>
            ) : (
              <>
                {products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/product/${p.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-ink-50"
                  >
                    <SuggestionThumb src={p.image_url} alt={p.name} />
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
                  onClick={() => submit(term)}
                  className="mt-1 block w-full border-t border-ink-50 px-4 py-2.5 text-left text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
                >
                  Show all results for “{trimmed}”
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </form>
  );
}

/** Square thumbnail for a search suggestion; falls back to the product's first
 *  letter when it has no image yet. */
function SuggestionThumb({ src, alt }: { src: string | null; alt: string }) {
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

/** Amazon-style "Deliver to {city} {pincode}" pulled from the user's default
 *  saved address. Links to the account page to add/change it. */
function DeliveryLocation() {
  const { data: addresses } = useAddresses();
  const def = addresses?.find((a) => a.is_default) ?? addresses?.[0];

  return (
    <a
      href="/account"
      className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-ink-50 xl:flex"
      title="Change delivery location"
    >
      <MapPin className="h-5 w-5 shrink-0 text-brand-500" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-[11px] text-ink-400">
          {def ? "Deliver to" : "Delivery"}
        </span>
        <span className="truncate text-sm font-semibold text-ink-800">
          {def ? `${def.city} ${def.pincode}` : "Add an address"}
        </span>
      </span>
    </a>
  );
}
