# Fastner — IBC Fasteners e-commerce (monorepo)

B2B/B2C storefront + admin for **IBC** ("Providing Fastening Solutions Since 1991"), an
industrial fastener supplier (screws, bolts, nuts, washers, anchors, tools). Two apps:

- `fastner-backend/` — FastAPI + SQLAlchemy 2 + Alembic on PostgreSQL, managed by Poetry.
- `fastner-frontend/` — Next.js 16 (App Router) + React 19. **FE-specific rules: `fastner-frontend/CLAUDE.md`.**
- `IBC_Website_SOW.pdf` — original scope of work.

This file is loaded in every session — keep it dense. Read `/docs` (FastAPI) or the feature
folder for exact signatures rather than duplicating them here.

## Run / dev

**Backend** (`cd fastner-backend`):
- `./dev_start.sh` — installs deps (`poetry sync`), starts Postgres in Docker on **:54323**, runs migrations, runs uvicorn on **:8000** (`--reload`). `./dev_stop.sh` stops the DB.
- DB URL: `postgresql://postgres:postgres@localhost:54323/fastner_db` (container `fastner-postgres-db`).
- API + Swagger: `http://localhost:8000` / `http://localhost:8000/docs`.
- Run anything in the env with `poetry run …` (e.g. `poetry run python -c "import app.main"`).
- Migrations: `poetry run alembic revision --autogenerate -m "msg"` → review → `poetry run alembic upgrade head` (or `poetry run sh migration.sh`). **Any model/column change needs a migration.**

**Frontend** (`cd fastner-frontend`):
- `npm run dev` (Next on **:3000**). Typecheck with `npx tsc --noEmit`; lint with `npm run lint`.
- **Do NOT `npm run build` after each edit** — the user runs `npm run dev`.

CORS: backend only allows origin `http://localhost:3000`.

## Backend architecture

Feature-folder modules under `app/<feature>/`, each with `models.py` / `schemas.py` /
`service.py` / `router.py` (+ `helpers.py` / `emails.py` where relevant). All routers are
wired in `app/main.py`. Modules: **auth, address, cart, catalog, coupons, industries,
orders, payments, reviews, settings, support**.

- `core/` — `config.py` (`Settings` from env, `settings` singleton), `database.py` (`Base`, engine, `get_db` session dependency).
- `utils/` — `dependencies.py` (`get_current_user`, `require_role(*roles)`), `email.py` (Postmark sender), `token_processor.py` (Fernet `encrypt_token`/`decrypt_token`).

**Patterns**
- Routers stay thin and delegate to `<Feature>Service(db)`; business logic lives in the service.
- Routers are split by audience: a `public_router` (no auth), `router` (signed-in customer, `Depends(get_current_user)`), and/or `admin_router` (`Depends(require_role("admin","superadmin"))`). Not every module has all three.
- Response models use `ConfigDict(from_attributes=True)`; **plain Python `@property`s on a model serialize through it** (e.g. `User.has_password`).
- Comment density is high here — keep the surrounding style when editing.

**Auth & security** (`app/auth/`)
- bcrypt password hashing (`helpers.py`). `hashed_password` is nullable → Google-only accounts (`google_id`); use `User.has_password`.
- JWT access token (HS256, default 30 min) + opaque DB-backed refresh token: SHA-256 hash is the PK (O(1) lookup), the raw token is **Fernet-encrypted** at rest (`CRYPTOGRAPHY_SECRET`). Refresh **rotates** on use. Password change/reset **revokes all refresh tokens**; change-password re-issues a fresh pair so the acting device stays signed in.
- Email verification + password reset = single-use SHA-256-hashed tokens; links emailed via Postmark. `AUTO_VERIFY_EMAIL` gates whether verification is required (dev → true: no email, signup logs in; prod → false).

**Domain notes**
- **Orders** are persisted at checkout (a snapshot of the cart, with price snapshots on line items). Status lifecycle `pending_approval → approved → shipped → delivered`, plus `declined` / `cancelled`. In `orders/models.py`: `PURCHASED_STATUSES` (everything but declined/cancelled — gates verified-purchase reviews); `ACTIVE_STATUSES` = pending_approval/approved/shipped (blocks account deletion). `payment_status`: unpaid/paid/refund_initiated/refunded.
- **B2B/B2C dual pricing**: products carry both prices; cart and order carry a `mode` (`b2c`/`b2b`).
- **Reviews**: verified-purchase gated, one per user+product, media uploaded to Cloudinary.
- **Payments**: Razorpay, **config-gated** by `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` (both blank → orders placed without payment). Test keys (`rzp_test_…`) on dev, live keys in prod — that env diff is the only switch. Talks to Razorpay over stdlib `urllib`. `KEY_ID` is publishable (frontend reads it from `GET /payments/config`); `KEY_SECRET` is server-only.
- **settings** module = store-wide settings (e.g. GST/tax rate, public + admin). **support** module = customer support tickets + admin desk (`emails.py`).
- **Every FK to `users.id` is `ON DELETE CASCADE`** — deleting a user removes addresses, cart, orders, reviews, tickets and tokens.

**Env** (`.env`, template in `.env.example`): `ENVIRONMENT`, `DATABASE_URL`, `JWT_SECRET_KEY`,
`CRYPTOGRAPHY_SECRET`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`,
`AUTO_VERIFY_EMAIL`, `POSTMARK_SERVER_TOKEN` / `EMAIL_FROM` (`sales@indbolt.com`),
`FRONTEND_BASE_URL`, `CLOUDINARY_*`, `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.

## Frontend architecture (summary — details in `fastner-frontend/CLAUDE.md`)

Next.js 16 App Router + React 19, Tailwind v4 (tokens in `src/app/globals.css` `@theme`),
**TanStack React Query** (server state) + **Zustand** (client state), `lucide-react`, `sonner` toasts.

- `src/app/` — storefront routes + `/admin/*` dashboard (gated by `useRequireAdmin`, sidebar in `admin/layout.tsx`).
- `src/features/<domain>/` — `api.ts` (raw `apiFetch` calls) + `queries.ts` (React Query hooks) + `types.ts` (mirror backend schemas). Domains mirror the backend modules.
- `src/components/` — `layout/` (Header, Footer), `sections/`, `ui/`, `admin/`, `auth/`.
- `src/lib/` — `api/client.ts` (fetch wrapper: attaches Bearer from auth-store, dedupes + auto-refreshes on 401), `api/public-server.ts` (cached, no-auth fetch for Server Components / metadata / sitemap), `store/` (`auth-store` key `ibc-auth`; `mode-store` key `ibc-mode`), `seo.ts`, `site-data.ts` (all copy/nav/content), `cloudinary.ts`, `razorpay.ts`, `providers.tsx`.
- Client components fetch via `features/*/queries`; Server Components/metadata use `lib/api/public-server.ts`. Auth via `useAuthStore`; guards `useRequireAuth` (customer) / `useRequireAdmin` (admin).
- **FE env** (`.env.local`): `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000`), `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.
- `layout.tsx` has a pre-hydration **bfcache reload shim** (pages navigate via full-page `<a>`) — keep it in mind when touching navigation.

## Deploy

- Frontend → **Vercel** project `fastner` (root dir `fastner-frontend`); push to `master` auto-deploys to production.
- Backend is hosted separately; production needs live env (`ENVIRONMENT=production`, real `DATABASE_URL`, real secrets, Postmark token, `rzp_live_…` keys).

## Working rules

- **Git: only push from the `akshatgg` GitHub account** (`gh auth status` / `gh auth switch -u akshatgg`). Only commit/push when explicitly asked. Write commit messages from the actual diff.
- Next 16 has breaking changes vs older knowledge — when unsure, check `fastner-frontend/node_modules/next/dist/docs/` (see `fastner-frontend/AGENTS.md`).
- Adding a backend module → create the `app/<feature>/` files and register its router(s) in `app/main.py`.
