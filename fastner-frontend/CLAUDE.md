@AGENTS.md

# IBC Fasteners — Frontend

Marketing/storefront frontend for **IBC** ("Providing Fastening Solutions Since 1991"), a
B2B industrial fastener supplier (screws, bolts, nuts, washers, anchors, tools).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind CSS v4** (config-less; tokens live in `src/app/globals.css` under `@theme`)
- **lucide-react** for icons (note: brand logos like Instagram/Facebook/LinkedIn were
  removed from lucide — use inline SVGs for those, see `Footer.tsx`)
- **TanStack React Query** (server state / data fetching) + **Zustand** (client state) —
  both installed and in use across the app. **sonner** for toasts.
- This is a full storefront + admin app talking to the FastAPI backend, not just a landing
  page. See the repo-root `../CLAUDE.md` for the backend and cross-cutting picture.

## Brand

- Orange `--color-brand-500: #f26a21`, charcoal `--color-ink-950: #121212` (from the logo).
- Display font: **Oswald** (condensed, uppercase headings — industrial feel). Body: **Inter**.
- Logos in `public/`: `logo-dark.png` (for light bg), `logo-light.png` (for dark bg).
  Originals are in `public/assets/`.

## Structure

- `src/app/` — `layout.tsx` (fonts, metadata, JSON-LD, bfcache reload shim), `globals.css`
  (theme tokens), the landing `page.tsx`, storefront routes (category, product, cart,
  checkout, orders, account, settings, support, auth pages), and the `admin/*` dashboard
  (gated by `useRequireAdmin`; sidebar in `admin/layout.tsx`).
- `src/features/<domain>/` — per-domain `api.ts` (raw `apiFetch` calls), `queries.ts`
  (React Query hooks), `types.ts` (mirror backend schemas). Domains: auth, catalog, cart,
  orders, payments, reviews, address, coupons, industries, settings, support.
- `src/components/` — `layout/` (Header w/ profile dropdown, Footer), `sections/` (landing),
  `ui/` (`SectionHeading`, `Modal`, `FastenerArt`, …), `admin/`, `auth/`.
- `src/lib/` — `api/client.ts` (auth fetch wrapper + 401 auto-refresh), `api/public-server.ts`
  (cached no-auth fetch for Server Components / metadata / sitemap), `store/` (`auth-store`
  → `ibc-auth`, `mode-store` → `ibc-mode` B2C/B2B), `seo.ts`, `cloudinary.ts`, `razorpay.ts`,
  `providers.tsx`, and `site-data.ts`.
- `src/lib/site-data.ts` — single source of truth for nav, categories, industries, stats,
  testimonials and contact details. Edit static content/copy here, not in components.

## Conventions

- Default to **Server Components**; add `"use client"` only where interactivity is needed.
- Static content/copy/links come from `src/lib/site-data.ts` — keep it that way. Dynamic
  data comes from the backend via `src/features/*` hooks.
- Typecheck with `npx tsc --noEmit`; lint with `npm run lint`. **Don't `npm run build` after
  every edit** — the user runs `npm run dev`.

## Git & pushing

- **Only push from the `akshatgg` GitHub account.** The repo remote is
  `github.com/akshatgg/fastner`. Before pushing, confirm the active credential is `akshatgg`
  (`gh auth status`); if a different account is active, switch with `gh auth switch -u akshatgg`.
  Do not push under any other account.
  > Heads up: at last check the active `gh` account was `akshatgggg`, not `akshatgg` — confirm
  > the right account is active before the first push.
- **Only push/commit when explicitly asked.**
- **Write commit messages from the actual diff** — summarize what changed (run `git diff`/
  `git status` first), not a generic message. Use a concise imperative subject line plus a
  short body describing the notable changes.
