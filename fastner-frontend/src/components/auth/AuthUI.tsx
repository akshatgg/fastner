"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { SITE, AUTH_HIGHLIGHTS, LOGOS } from "@/lib/site-data";
import { HexNut, BoltSide } from "@/components/ui/FastenerArt";

/** Split-screen auth chrome: industrial brand panel + a centred form column. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel (desktop only) */}
      <aside className="relative hidden overflow-hidden bg-ink-950 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div
          aria-hidden
          className="absolute -left-24 top-10 h-96 w-96 rounded-full bg-brand-600/25 blur-[120px]"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <HexNut className="absolute -right-12 top-10 h-64 w-64 rotate-12 text-white/[0.05]" />
          <BoltSide className="absolute -left-10 bottom-28 h-20 w-96 -rotate-12 text-white/[0.06]" />
        </div>

        <div className="relative px-12 pt-12">
          <a href="/" className="inline-flex">
            <Image
              src={LOGOS.light}
              alt={SITE.fullName}
              width={LOGOS.width}
              height={LOGOS.height}
              className="h-12 w-auto"
            />
          </a>
        </div>

        <div className="relative px-12 pb-10">
          <p className="font-display text-base uppercase tracking-[0.2em] text-brand-400 sm:text-lg">
            {SITE.tagline}
          </p>
          <h2 className="mt-4 max-w-xl font-display text-5xl font-bold uppercase leading-[1.05] xl:text-6xl">
            The right fastener,{" "}
            <span className="text-brand-500">every single time.</span>
          </h2>
          <ul className="mt-10 space-y-4">
            {AUTH_HIGHLIGHTS.map(({ Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 text-lg text-ink-200 sm:text-xl"
              >
                <Icon className="h-6 w-6 shrink-0 text-brand-500" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div aria-hidden className="bg-hazard h-3 w-full" />
      </aside>

      {/* Form column */}
      <section className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <a href="/" className="mb-8 flex justify-center lg:hidden">
            <Image
              src={LOGOS.dark}
              alt={SITE.fullName}
              width={LOGOS.width}
              height={LOGOS.height}
              className="h-12 w-auto"
            />
          </a>
          {children}
        </div>
      </section>
    </main>
  );
}

export function AuthHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8 text-center lg:text-left">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-ink-950">
        {title}
      </h1>
      <p className="mt-2 text-sm text-ink-500">{subtitle}</p>
    </div>
  );
}

export function AuthField({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  required = true,
  labelRight,
  value,
  onChange,
  error,
  disabled,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  labelRight?: ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-ink-800">
          {label}
        </label>
        {labelRight}
      </div>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={id}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          {...(onChange
            ? { value: value ?? "", onChange: (e) => onChange(e.target.value) }
            : {})}
          className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-sm outline-none transition-colors placeholder:text-ink-400 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
            error
              ? "border-danger-400 focus:border-danger-500 focus:ring-danger-500/30"
              : "border-ink-200 focus:border-brand-500 focus:ring-brand-500/30"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-ink-700"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-danger-600">{error}</p>}
    </div>
  );
}

/** Inline form-level error banner (e.g. failed login / signup). */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-danger-200 bg-danger-50 px-3.5 py-2.5 text-sm font-medium text-danger-700"
    >
      {message}
    </p>
  );
}

export function SubmitButton({
  children,
  loading = false,
  disabled = false,
}: {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="w-full rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function GoogleButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-3 rounded-md border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-800 shadow-sm transition-colors hover:bg-ink-50"
    >
      <GoogleIcon className="h-5 w-5" />
      {label}
    </button>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-ink-100" />
      <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
        {label}
      </span>
      <span className="h-px flex-1 bg-ink-100" />
    </div>
  );
}

/** Small labelled checkbox used for "remember me" / terms.
 *  Controlled when `checked`/`onChange` are passed, uncontrolled otherwise. */
export function Checkbox({
  id,
  children,
  checked,
  onChange,
}: {
  id: string;
  children: ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2 text-sm text-ink-600">
      <input
        id={id}
        name={id}
        type="checkbox"
        {...(onChange
          ? { checked: checked ?? false, onChange: (e) => onChange(e.target.checked) }
          : {})}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-brand-500 accent-brand-500 focus:ring-brand-500/40"
      />
      <span>{children}</span>
    </label>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
