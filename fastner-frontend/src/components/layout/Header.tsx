"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Menu, X, Phone, Mail, Search, ShoppingCart, User } from "lucide-react";
import { NAV_LINKS, SITE } from "@/lib/site-data";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
              className="hidden items-center justify-center rounded-md p-2.5 text-ink-700 transition-colors hover:bg-ink-50 hover:text-brand-600 sm:inline-flex"
            >
              <Search className="h-6 w-6" />
            </button>

            <a
              href="/cart"
              aria-label="Cart"
              className="relative inline-flex items-center justify-center rounded-md p-2.5 text-ink-700 transition-colors hover:bg-ink-50 hover:text-brand-600"
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold leading-none text-white">
                0
              </span>
            </a>

            <a
              href="/sign-in"
              aria-label="Account"
              className="inline-flex items-center justify-center rounded-md p-2.5 text-ink-700 transition-colors hover:bg-ink-50 hover:text-brand-600"
            >
              <User className="h-6 w-6" />
            </a>

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
