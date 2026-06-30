# Deploying the CastFlow API to Railway

The frontend lives on Vercel. The API is a **long-running Bun server with native
WebSockets** (`Bun.serve` + `createBunWebSocket` for real-time messaging), so it
**cannot run on Vercel** (serverless functions can't hold WebSocket connections
or run a persistent Bun process). Railway runs it as a normal container — this
guide covers a deploy your team can test against.

The repo already contains everything Railway needs:

- `Dockerfile` (repo root) — Bun monorepo image: installs the workspace,
  `prisma generate`, runs `apps/api/src/index.ts` directly (Bun runs TS).
- `railway.json` — Dockerfile builder, `/health` healthcheck, and a
  **preDeployCommand** that syncs the schema with `prisma db push`.
- `.dockerignore` — keeps `node_modules`, `.next`, `.env*` out of the image.

> Commit & push these (and the latest `main`) before deploying — Railway builds
> from your connected GitHub repo.

---

## 1. Create the Railway project

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
   → pick this repo. Railway detects `railway.json` + `Dockerfile`.
2. **Add a database:** in the project, **New → Database → PostgreSQL**.
3. **Generate a public URL:** API service → **Settings → Networking →
   Generate Domain**. You'll get `https://<something>.up.railway.app`. Note it —
   it's your `API_HOST` below.

## 2. Service environment variables

API service → **Variables**. `PORT` is injected by Railway automatically — do
**not** set it.

| Variable | Value |
|---|---|
| `NODE_ENV` | `staging` (easiest for team testing — see §5) or `production` |
| `DATABASE_URL` | reference the Postgres plugin: `${{Postgres.DATABASE_URL}}` |
| `BETTER_AUTH_SECRET` | a random 32+ char string |
| `BETTER_AUTH_URL` | `https://<API_HOST>` (the Railway URL from §1.3) |
| `FRONTEND_URL` | your exact Vercel origin, e.g. `https://castflow.vercel.app` (no trailing slash) |
| `STRIPE_SECRET_KEY` | `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (from §4) |
| `STRIPE_PRICE_ID` | `price_…` (the caster subscription price) |
| `R2_ACCOUNT_ID` | from Cloudflare |
| `R2_ACCESS_KEY_ID` | from Cloudflare |
| `R2_SECRET_ACCESS_KEY` | from Cloudflare |
| `R2_PUBLIC_BUCKET` | `castflow-public-dev` |
| `R2_PRIVATE_BUCKET` | `castflow-private-dev` |
| `R2_CONTRACTS_BUCKET` | `castflow-contracts-dev` |
| `R2_PUBLIC_URL` | `https://pub-…r2.dev` |
| `R2_JURISDICTION` | `eu` (your buckets are EU-jurisdiction) |
| `RESEND_API_KEY` | `re_…` (required; see §5 if you don't want real email yet) |
| `EMAIL_FROM` | optional (defaults to `noreply@castflow.co.uk`) |
| `CONTACT_INBOX_EMAIL` | optional |
| `TURNSTILE_SECRET_KEY` | optional (captcha; leave unset to disable) |
| `DEV_AUTO_VERIFY_EMAIL` | `true` for team testing on `staging` (see §5) |

The API validates all required vars at startup (`src/lib/env.ts`) and exits if
any is missing — check the deploy logs if the container won't boot.

## 3. Point the Vercel frontend at the API (same-origin proxy)

Frontend (`*.vercel.app`) and API (`*.up.railway.app`) are different domains, so
a direct cross-site session cookie can't be read by the frontend's server-side
auth guards. Instead the frontend **proxies** API traffic on its own origin
(via `next.config.ts` rewrites), keeping the session cookie first-party.

In the Vercel project → **Settings → Environment Variables**, set (and redeploy):

| Variable | Value |
|---|---|
| `API_ORIGIN` | `https://<API_HOST>` (server-only; the proxy/SSR target) |
| `NEXT_PUBLIC_API_URL` | **empty** (browser calls same-origin `/api/*`, which is proxied) |
| `NEXT_PUBLIC_WS_URL` | `wss://<API_HOST>` |

How it works: the browser calls `/api/auth/*` and `/api/v1/*` on the Vercel
domain → `next.config` rewrites them to `API_ORIGIN` → the API's `Set-Cookie`
comes back on the Vercel origin as a **first-party** cookie. Server components
(auth guards) read that cookie and forward it to `API_ORIGIN` directly.

> **Messaging caveat:** `NEXT_PUBLIC_WS_URL` still points straight at Railway, so
> the live WebSocket is cross-site — live push may not work in every browser.
> Messages still **load and send over REST** (proxied), so they work; they just
> won't update in real time without a refresh. (Goes away once frontend + API
> share a parent domain.)

## 4. Stripe webhook

The webhook is mounted at the **root**, not under `/api/v1`:

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**:
   `https://<API_HOST>/webhooks/stripe`
2. Subscribe to: `checkout.session.completed`,
   `customer.subscription.created/updated/deleted`, `invoice.payment_failed`.
3. Copy the endpoint's **Signing secret** → set `STRIPE_WEBHOOK_SECRET` (§2) and redeploy.

## 5. Cross-site cookies & team-test auth

- **Cookies:** frontend (`*.vercel.app`) and API (`*.up.railway.app`) are
  different sites, so the session cookie is set to `SameSite=None; Secure;
  Partitioned` automatically when `NODE_ENV` is `production` or `staging`
  (`src/lib/auth.ts`). Both are HTTPS on Railway/Vercel, so this just works.
  CORS already allows credentials for `FRONTEND_URL`.
- **Skip email verification for testers:** set `NODE_ENV=staging` **and**
  `DEV_AUTO_VERIFY_EMAIL=true` — new sign-ups are auto-verified so the team can
  log in without a working inbox. (With `NODE_ENV=production`, verification is
  always enforced and you need a real `RESEND_API_KEY` + verified domain.)
- Only the single `FRONTEND_URL` origin is allowed. Vercel **preview** URLs
  (per-branch) won't pass the origin/CORS guard — test against the one
  production Vercel URL you set as `FRONTEND_URL`.

## 6. R2 CORS for browser uploads

Portfolio/logo uploads go **browser → R2** via presigned URLs, so the public
bucket's CORS must allow your Vercel origin. In Cloudflare → R2 → the public
bucket → **Settings → CORS Policy**, add your `FRONTEND_URL` to `AllowedOrigins`
with `PUT` and `GET` (see `docs/R2-SETUP.md` §CORS for the JSON).

## 7. Smoke test

```bash
curl https://<API_HOST>/health
# -> {"success":true,"data":{"status":"ok","env":"staging"}}
```

Then load the Vercel site, register, and confirm you stay logged in across
requests (proves the cross-site cookie works) and that messaging connects.

---

## Schema sync & migrations

`railway.json`'s `preDeployCommand` runs `prisma db push` each deploy, which
syncs the schema to the database without migration files (the project doesn't
use a `migrations/` folder). `--accept-data-loss` is included so schema changes
apply without an interactive prompt — fine for a fresh staging DB, but for
**production** you should switch to versioned migrations (`prisma migrate`).

## Why not Nixpacks?

Railway's auto-builder can detect Bun, but this is a Turborepo workspace with
Prisma — the Dockerfile makes the install/generate/run steps explicit and
reproducible. If you ever slim the image, install only the `apps/api`,
`packages/types`, and `packages/validators` workspaces instead of the whole repo.
