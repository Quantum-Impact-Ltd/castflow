# Cloudflare R2 Setup

CastFlow stores all files in Cloudflare R2 (S3‑compatible). The API talks to R2
with the AWS S3 SDK; the browser uploads **directly** to R2 via short‑lived
presigned URLs (files never stream through the API).

## 1. Bucket model

Create **three** buckets. They are intentionally separate so private documents
can never be served publicly.

| Bucket env var          | Suggested name        | Access  | Holds                                              |
| ----------------------- | --------------------- | ------- | -------------------------------------------------- |
| `R2_PUBLIC_BUCKET`      | `castflow-public`     | Public  | Portfolio photos/videos, caster logos, job covers  |
| `R2_PRIVATE_BUCKET`     | `castflow-private`    | Private | Artist ID documents (read only via presigned GET)  |
| `R2_CONTRACTS_BUCKET`   | `castflow-contracts`  | Private | Generated, signed contract PDFs (presigned GET)     |

Code mapping: `apps/api/src/lib/r2.ts` (`Buckets.public | private | contracts`).
Object keys are server‑generated as `${type}/${userId}/${uuid}.${ext}` — the
API rejects any confirm whose key prefix doesn't match the caller (so a client
can't graft someone else's object onto their profile).

## 2. Create the buckets + credentials

1. Cloudflare dashboard → **R2** → **Create bucket** ×3 (names above).
2. **Account ID** → it's in the R2 overview / your dashboard URL → `R2_ACCOUNT_ID`.
   The S3 endpoint is derived as `https://<account_id>.r2.cloudflarestorage.com`.
3. **R2 → Manage R2 API Tokens → Create API token**:
   - Permission: **Object Read & Write**.
   - Scope to the three buckets (or all).
   - Copy the **Access Key ID** → `R2_ACCESS_KEY_ID` and **Secret Access Key**
     → `R2_SECRET_ACCESS_KEY` (shown once).

## 3. Public bucket → public URL

The public bucket needs a public base URL (`R2_PUBLIC_URL`) that the API stores
on records and the web app renders.

- **Recommended:** R2 bucket → **Settings → Public access → Connect a custom
  domain** (e.g. `https://cdn.castflow.co.uk`). Set `R2_PUBLIC_URL` to it.
- Or enable the **`r2.dev` managed subdomain** for the public bucket and use
  that as `R2_PUBLIC_URL` (fine for staging; rate‑limited, not for prod).
- Keep the private and contracts buckets **private** — do NOT connect a domain.

The web app renders R2 images via `RemoteImage` (`unoptimized`), so the host can
be any custom/`r2.dev` domain without touching `next.config.ts`.

## 4. CORS (required for direct browser uploads)

The browser does a `PUT` straight to R2 against the presigned URL, so the
**public** and **private** buckets need a CORS policy allowing `PUT` from the
web origins. Bucket → **Settings → CORS policy**:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://staging.castflow.co.uk",
      "https://castflow.co.uk"
    ],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 3600
  }
]
```

The contracts bucket is written server‑side only and read via presigned GET, so
it does not need browser CORS.

## 5. Environment variables (`apps/api/.env`)

```bash
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_PUBLIC_BUCKET=castflow-public
R2_PRIVATE_BUCKET=castflow-private
R2_CONTRACTS_BUCKET=castflow-contracts
R2_PUBLIC_URL=https://cdn.castflow.co.uk   # public bucket's domain (no trailing slash)
```

All seven are **required** and validated at startup (`apps/api/src/lib/env.ts`,
Zod) — the API process exits if any is missing or malformed. There are no
web‑side R2 secrets.

## 6. Upload limits (enforced server‑side)

Set in `packages/validators/src/upload.ts` (`UPLOAD_LIMITS`) and re‑checked in
`getPresignedUrl` before a URL is issued:

| Type             | Allowed content types                          | Max size |
| ---------------- | ---------------------------------------------- | -------- |
| `portfolio_photo`| jpeg, png, webp                                | 10 MB    |
| `portfolio_video`| mp4, quicktime                                 | 200 MB   |
| `id_document`    | jpeg, png, pdf                                 | 5 MB     |
| `caster_logo`    | jpeg, png, webp, svg                           | 2 MB     |
| `job_cover`      | jpeg, png, webp                                | 10 MB    |

## 7. The flow

```
Client → POST /uploads/presigned-url  → API returns { uploadUrl, key, publicUrl }
Client → PUT  <uploadUrl> (direct to R2, browser → R2)
Client → POST /uploads/confirm { type, key } → API persists the record
```

Private reads (ID docs, contract PDFs) never expose the object — the API issues
a short‑lived (10‑min) presigned **GET** per request.

## 8. R2 endpoint inventory

All file endpoints, the service that backs them, and the bucket they touch:

| Method & path                                   | Service                                   | Bucket     |
| ----------------------------------------------- | ----------------------------------------- | ---------- |
| `POST /uploads/presigned-url`                   | `UploadService.getPresignedUrl`           | public/private (by type) |
| `POST /uploads/confirm`                         | `UploadService.confirmUpload`             | — (DB)     |
| `PATCH /uploads/portfolio/:id`                  | `UploadService.updatePortfolioItem`       | — (DB)     |
| `PATCH /uploads/portfolio/:id/primary`          | `UploadService.setPrimaryPortfolioItem`   | — (DB)     |
| `DELETE /uploads/portfolio/:id`                 | `UploadService.deletePortfolioItem`       | — (DB)     |
| `GET /artists/me/id-document/url`               | `UploadService.getMyIdDocumentUrl`        | private    |
| `GET /admin/applications/:id/id-document/url`   | `UploadService.getIdDocumentUrlByProfileId` | private  |
| `GET /contracts/bookings/:bookingId/pdf-url`    | `ContractService.getPdfDownloadUrl`       | contracts  |
| (internal write on contract sign)               | `ContractService` PDF render → PutObject  | contracts  |

Test coverage: `apps/api/tests/uploads/key-ownership.test.ts` (confirm/key
ownership) and `apps/api/tests/uploads/upload-service.test.ts` (presign
validation + key/bucket routing, portfolio delete/update/primary, ID‑doc
presigned reads, contract‑PDF presigned read incl. access control).

## 9. Local dev & tests

- **Tests** mock R2 entirely (`apps/api/tests/helpers/r2-mock.ts` + the
  presigner mock in `tests/helpers/setup.ts`) — no live bucket needed.
- **Local dev** against real R2: point the env vars at a dedicated dev bucket
  set (e.g. `castflow-public-dev`). There is no R2 emulator in the stack.

## 10. Known follow‑ups

- **Orphaned objects:** deleting a portfolio item, replacing a caster logo, or
  re‑uploading an ID document removes/updates the DB row but does **not** delete
  the old R2 object (no `DeleteObjectCommand` is issued). Add lifecycle cleanup
  or an R2 lifecycle rule if storage cost becomes a concern.
