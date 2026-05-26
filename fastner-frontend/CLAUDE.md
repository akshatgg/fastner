@AGENTS.md

# IBC Fasteners — Frontend

Marketing/storefront frontend for **IBC** ("Providing Fastening Solutions Since 1991"), a
B2B industrial fastener supplier (screws, bolts, nuts, washers, anchors, tools).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind CSS v4** (config-less; tokens live in `src/app/globals.css` under `@theme`)
- **lucide-react** for icons (note: brand logos like Instagram/Facebook/LinkedIn were
  removed from lucide — use inline SVGs for those, see `Footer.tsx`)
- **Planned for API work:** TanStack **React Query** (server state / data fetching) +
  **Zustand** (client state). Not installed yet — only the landing page exists so far.
  The contact form in `Contact.tsx` is local-only and is the first place to wire a
  React Query mutation when the API is ready.

## Brand

- Orange `--color-brand-500: #f26a21`, charcoal `--color-ink-950: #121212` (from the logo).
- Display font: **Oswald** (condensed, uppercase headings — industrial feel). Body: **Inter**.
- Logos in `public/`: `logo-dark.png` (for light bg), `logo-light.png` (for dark bg).
  Originals are in `public/assets/`.

## Structure

- `src/app/` — `layout.tsx` (fonts + metadata), `page.tsx` (assembles sections), `globals.css` (theme tokens).
- `src/components/layout/` — `Header.tsx` (client; sticky nav + mobile drawer), `Footer.tsx`.
- `src/components/sections/` — Hero, Categories, Industries, About, Contact.
- `src/components/ui/` — shared primitives: `SectionHeading`, `FastenerArt` (decorative hex-nut/bolt SVGs).
- `src/lib/site-data.ts` — single source of truth for nav, categories, features, industries,
  stats, testimonials and contact details. Edit content here, not in components.

## Conventions

- Default to **Server Components**; add `"use client"` only where interactivity is needed
  (currently `Header` and `Contact`).
- All content/copy/links come from `src/lib/site-data.ts` — keep it that way.
- Verify changes with `npm run build` (TypeScript-checked) before considering work done.

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
