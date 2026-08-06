"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { SITE, CONTACT_ITEMS } from "@/lib/site-data";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  // NOTE: wiring is intentionally local-only for now.
  // The real submit will move to a React Query mutation once the API is ready.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="contact" className="bg-ink-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card lg:grid-cols-5">
          {/* Info panel */}
          <div className="relative overflow-hidden bg-ink-950 p-8 text-white sm:p-10 lg:col-span-2">
            <div
              aria-hidden
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-600/30 blur-3xl"
            />
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-400">
              Let&rsquo;s talk
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-tight">
              Tell us what you need
            </h2>
            <p className="mt-4 text-ink-300">
              Looking for a specific fastener or planning a bulk order? Share your
              requirements with us and our team will help you with availability,
              pricing and the right product for your application.
            </p>

            <ul className="mt-10 space-y-5">
              {CONTACT_ITEMS.map((item) => {
                const Icon = item.icon;
                const content = (
                  <>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/5 text-brand-500">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-xs uppercase tracking-wide text-ink-400">
                        {item.label}
                      </span>
                      <span className="text-base font-medium text-white">
                        {item.value}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={item.label}>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="flex items-center gap-4 transition-opacity hover:opacity-80"
                      >
                        {content}
                      </a>
                    ) : (
                      <div className="flex items-center gap-4">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Form panel */}
          <div className="p-8 sm:p-10 lg:col-span-3">
            {submitted ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-16 w-16 text-brand-500" />
                <h3 className="mt-5 font-display text-2xl font-bold uppercase text-ink-900">
                  Thank you!
                </h3>
                <p className="mt-2 max-w-sm text-ink-500">
                  Your enquiry has been received. Our team will be in touch
                  shortly with pricing and availability.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Send another enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" name="name" placeholder="Your name" required />
                  <Field
                    label="Company"
                    name="company"
                    placeholder="Company name"
                  />
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    required
                  />
                  <Field
                    label="Phone"
                    name="phone"
                    type="tel"
                    placeholder={SITE.phone}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="mb-1.5 block text-sm font-semibold text-ink-800"
                  >
                    What do you need?
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="e.g. 500 × M8 hex bolts, grade 8.8, zinc plated…"
                    className="w-full rounded-lg border border-ink-200 bg-white px-4 py-3 text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <button
                  type="submit"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-600 sm:w-auto"
                >
                  Send enquiry
                  <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-semibold text-ink-800"
      >
        {label}
        {required && <span className="text-brand-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-ink-200 bg-white px-4 py-3 text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  );
}
