"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

import Eyebrow from "@/components/ui/Eyebrow";
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
    <section id="contact" className="bg-sand-100 py-20 sm:py-26">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid overflow-hidden shadow-[0_1px_2px_rgb(0_0_0/0.04),0_24px_60px_-30px_rgb(0_0_0/0.35)] lg:grid-cols-[2fr_3fr]">
          {/* Info panel — the last charcoal block before the footer. */}
          <div className="relative overflow-hidden bg-ink-950 p-8 pl-10 text-white sm:p-12 sm:pl-15">
            <span aria-hidden className="bg-hazard absolute left-0 top-0 h-full w-2" />
            <div aria-hidden className="bg-grid-white absolute inset-0 [--grid:56px]" />

            <div className="relative">
              <Eyebrow>Let&rsquo;s talk</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-bold uppercase leading-[1.02] tracking-[-0.005em] sm:text-[42px]">
                Tell us what you need
              </h2>
              <p className="mt-4.5 text-[15px] leading-[1.75] text-ink-300">
                Looking for a specific fastener or planning a bulk order? Share
                your requirements and our team will come back with availability,
                pricing and the right product for your application.
              </p>

              {/* Contact methods as a ruled list — the rules carry the
                  structure, so the rows need no boxes of their own. */}
              <ul className="mt-10 flex flex-col sm:mt-11">
                {CONTACT_ITEMS.map((item, i) => {
                  const Icon = item.icon;
                  const content = (
                    <>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-white/6 text-brand-500">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">
                          {item.label}
                        </span>
                        <span className="text-[17px] font-medium text-white">
                          {item.value}
                        </span>
                      </span>
                    </>
                  );
                  const rule = `flex items-center gap-4.5 border-t border-white/10 py-4.5 ${
                    i === CONTACT_ITEMS.length - 1 ? "border-b" : ""
                  }`;
                  return (
                    <li key={item.label}>
                      {item.href ? (
                        <a
                          href={item.href}
                          {...(item.href.startsWith("http")
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          className={`${rule} transition-opacity hover:opacity-80`}
                        >
                          {content}
                        </a>
                      ) : (
                        <div className={rule}>{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Form panel */}
          <div className="flex flex-col justify-center bg-white p-8 sm:p-12">
            {submitted ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-16 w-16 text-brand-500" />
                <h3 className="mt-5 font-display text-2xl font-bold uppercase text-ink-950 sm:text-[28px]">
                  Thank you!
                </h3>
                <p className="mt-2 max-w-sm leading-[1.7] text-ink-500">
                  Your enquiry has been received. Our team will be in touch
                  shortly with pricing and availability.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-sm font-semibold text-brand-500 hover:text-brand-600"
                >
                  Send another enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5.5">
                <div className="grid gap-5.5 sm:grid-cols-2">
                  <Field label="Full name" name="name" placeholder="Your name" required />
                  <Field label="Company" name="company" placeholder="Company name" />
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
                  <label htmlFor="message" className={LABEL}>
                    What do you need?
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="e.g. 500 × M8 hex bolts, grade 8.8, zinc plated…"
                    className="w-full resize-y border border-ink-200 bg-white px-4 py-3.5 text-[15px] text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-5">
                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap bg-brand-500 px-7 py-4 text-[13px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand-600"
                  >
                    Send enquiry
                    <Send className="h-4 w-4" />
                  </button>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-steel-500">
                    Typical reply within one working day
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Field labels are set in the utility face, matching the eyebrows and the
 *  stat labels — every piece of small meta on the page uses the same voice. */
const LABEL =
  "mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink-700";

/** Inputs are underlines rather than boxes: the form reads as a spec sheet
 *  being filled in, and only the textarea (a genuine multi-line area) is
 *  boxed. */
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
      <label htmlFor={name} className={LABEL}>
        {label}
        {required && <span className="text-brand-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full border-0 border-b border-ink-200 bg-white py-2.5 text-[15px] text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500"
      />
    </div>
  );
}
