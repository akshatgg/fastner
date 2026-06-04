"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
import { NAV_LINKS, SITE } from "@/lib/site-data";
import { useAuthStore } from "@/lib/store/auth-store";
import { useLogout } from "@/features/auth/queries";
import { useCartCount } from "@/features/cart/queries";
import { useAddresses } from "@/features/address/queries";
import SearchOverlay from "@/components/layout/SearchOverlay";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
      {/* Utility strip */}
      <div className="hidden bg-ink-950 text-ink-300 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-base sm:px-6 lg:px-8">
          <p className="font-display uppercase tracking-[0.2em] text-brand-500">
            {SITE.tagline}
          </p>
          <div className="flex items-center gap-6">
            <a
              href={SITE.phoneHref}
              className="flex items-center gap-2 transition-colors hover:text-white"
            >
              <Phone className="h-5 w-5 text-brand-500" />
              {SITE.phone}
            </a>
            <a
              href={SITE.emailHref}
              className="flex items-center gap-2 transition-colors hover:text-white"
            >
              <Mail className="h-5 w-5 text-brand-500" />
              {SITE.email}
            </a>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div
        className={[
          "border-b transition-all duration-200",
          scrolled
            ? "border-ink-100 bg-white/95 shadow-sm backdrop-blur"
            : "border-transparent bg-white",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <a href="/" className="flex shrink-0 items-center">
              <Image
                src="/logo-dark.png"
                alt={`${SITE.name} — ${SITE.tagline}`}
                width={437}
                height={122}
                priority
                className="h-12 w-auto sm:h-14"
              />
            </a>
            {mounted && isAuthed && <DeliveryLocation />}
          </div>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-base font-semibold text-ink-700 transition-colors hover:text-brand-600"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Account / cart / search actions */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center justify-center rounded-md p-2.5 text-ink-700 transition-colors hover:bg-ink-50 hover:text-brand-600"
            >
              <Search className="h-6 w-6" />
            </button>

            <a
              href="/cart"
              aria-label="Cart"
              className="relative inline-flex items-center justify-center rounded-md p-2.5 text-ink-700 transition-colors hover:bg-ink-50 hover:text-brand-600"
            >
              <ShoppingCart className="h-6 w-6" />
              {mounted && cartCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold leading-none text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
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
                        className="flex w-full items-center gap-2.5 border-t border-ink-50 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
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
                aria-label="Account"
                className="inline-flex items-center justify-center rounded-md p-2.5 text-ink-700 transition-colors hover:bg-ink-50 hover:text-brand-600"
              >
                <User className="h-6 w-6" />
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
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 top-[65px] bg-ink-950/40"
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
                  className="flex w-full items-center gap-2.5 py-3 text-left text-lg font-semibold text-red-600"
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

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
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
      className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-ink-50 md:flex"
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
