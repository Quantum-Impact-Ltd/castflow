# Feature 01 — Authentication

**Status:** 🟡 Not started
**Build order:** #1 (foundation feature — unblocks everything else)
**Estimated scope:** 2–3 sessions
**Owners:** Full stack

---

## 1. Scope

### In scope

- Register as artist (model or actor) — email + password, role-tagged user, dormant profile shell
- Register as caster — email + password, role-tagged user, dormant profile shell
- Email verification — Better Auth token → magic link → server-side mark verified
- Login (email + password) — session cookie, 7-day expiry, 5-min cookie cache
- Logout — destroy session
- Forgot password — request reset email
- Reset password — token-based set new password
- Social login — Google (Apple stubbed config-only; not wired into web UI)
- `GET /api/auth/get-session` — returns canonical user shape (Better Auth proxy, already in place)
- Post-login redirect by role:
  - artist + `approvalStatus === 'pending'/'rejected'` → `/onboarding/pending`
  - artist + `approvalStatus === 'approved'` → `/artist/dashboard`
  - caster → `/caster/dashboard`
  - admin → `/admin`

### Out of scope (for this feature)

- 2FA / MFA — not in MVP
- Magic-link login (passwordless) — not in MVP
- Apple OAuth web wiring — credentials stubbed but button hidden (PRD lists it; defer to feature 1.5 if needed)
- Account-suspended/banned screens — handled in admin feature
- Role switching after registration — out of MVP (one role per account, full stop)
- Profile completion (onboarding) — that is feature #2 (artist) / #4 (caster job flow)
- Password change while logged in — settings feature
- Account deletion — settings feature

### Hard business rules (from CLAUDE.md / PRD)

| Rule                                            | Where enforced                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Artists must be 18+                             | Onboarding (feature #2). DOB is **not** collected at registration.                       |
| Caster gets immediate access after email verify | Better Auth `emailVerified === true` → caster panel unlocked                             |
| Artist must wait for admin approval             | `user.approvalStatus !== 'approved'` → cannot access artist panel beyond `/onboarding/*` |
| Email is unique across all roles                | Better Auth's `user.email` unique constraint                                             |
| Sessions are HTTP-only cookies                  | Better Auth default — never expose tokens to JS                                          |
| Better Auth secret ≥ 32 chars                   | `env.ts` validation                                                                      |
| Banned users cannot re-register with same email | Block at the `signUpEmail` callback by checking `user.status === 'banned'`               |

---

## 2. API contract

All endpoints return the canonical envelope: `{success:true,data:T}` or `{success:false,error:{code,message,fields?}}`.

### Better Auth-handled (auto-mounted at `/api/auth/**`)

These are already wired via `app.on(['GET','POST'], '/api/auth/**', auth.handler)` and require **no new code** beyond callbacks (see §4):

| Method | Path                              | Purpose                                                                            |
| ------ | --------------------------------- | ---------------------------------------------------------------------------------- |
| `POST` | `/api/auth/sign-up/email`         | Better Auth's built-in (not used directly — our wrappers below call it internally) |
| `POST` | `/api/auth/sign-in/email`         | Email + password login                                                             |
| `POST` | `/api/auth/sign-out`              | Logout                                                                             |
| `GET`  | `/api/auth/verify-email`          | Verify email token from magic link                                                 |
| `POST` | `/api/auth/forget-password`       | Request reset email                                                                |
| `POST` | `/api/auth/reset-password`        | Submit new password with token                                                     |
| `GET`  | `/api/auth/sign-in/social/google` | Initiate Google OAuth                                                              |
| `GET`  | `/api/auth/callback/google`       | Google OAuth callback                                                              |
| `GET`  | `/api/auth/get-session`           | Current session — used by `auth-server.ts` proxy                                   |

### Castflow wrappers (mounted at `/api/v1/auth/*`)

Custom endpoints that wrap Better Auth's `auth.api.signUpEmail()` so we can attach role + create profile shell atomically. Located in `apps/api/src/routes/auth.ts`.

| Method | Path                           | Validator              | Returns                                                |
| ------ | ------------------------------ | ---------------------- | ------------------------------------------------------ |
| `POST` | `/api/v1/auth/register-artist` | `registerArtistSchema` | `{ user: { id, email }, verificationEmailSent: true }` |
| `POST` | `/api/v1/auth/register-caster` | `registerCasterSchema` | `{ user: { id, email }, verificationEmailSent: true }` |

**Why wrap?** Better Auth's `sign-up/email` doesn't know about ArtistProfile / CasterProfile. We need the user row + profile row created in one transaction so an interrupted signup never leaves orphans.

### Error codes

Add to `src/errors/ErrorCodes.ts`:

| Code                  | HTTP | Meaning                               |
| --------------------- | ---- | ------------------------------------- |
| `EMAIL_TAKEN`         | 409  | Email already registered              |
| `WEAK_PASSWORD`       | 400  | Password fails strength schema        |
| `INVALID_CREDENTIALS` | 401  | Login email/password mismatch         |
| `EMAIL_NOT_VERIFIED`  | 403  | Login attempted before verification   |
| `INVALID_TOKEN`       | 400  | Reset/verify token expired or unknown |
| `BANNED`              | 403  | User is banned — block at signin too  |
| `SUSPENDED`           | 403  | User is suspended                     |

---

## 3. Validators

Already defined in `packages/validators/src/auth.ts`:

```ts
registerArtistSchema // { email, password, firstName, lastName, artistType }
registerCasterSchema // { email, password, companyName, companyType, contactName }
loginSchema // { email, password }
forgotPasswordSchema // { email }
resetPasswordSchema // { token, password }
```

`passwordSchema` requires ≥ 8 chars, ≥ 1 digit, ≥ 1 special char. **Do not relax this without team sign-off.**

---

## 4. Backend work

### 4.1 Better Auth configuration (`apps/api/src/lib/auth.ts`)

Add the missing pieces:

**a) Email-sending callbacks** — currently no-ops; `requireEmailVerification: true` silently fails without these.

```ts
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
  sendResetPassword: async ({ user, url }) => {
    await EmailService.sendPasswordReset({ to: user.email, resetUrl: url })
  },
},
emailVerification: {
  sendVerificationEmail: async ({ user, url }) => {
    await EmailService.sendVerificationEmail({ to: user.email, verifyUrl: url })
  },
  autoSignInAfterVerification: false,
},
```

**b) Database hook — block banned email on re-register**

```ts
databaseHooks: {
  user: {
    create: {
      before: async (user) => {
        const banned = await prisma.user.findFirst({
          where: { email: user.email, status: 'banned' },
        })
        if (banned) throw new AppError('BANNED', 'This email is blocked', 403)
        return { data: user }
      },
    },
  },
},
```

**c) Trusted origins** — already wired to `env.FRONTEND_URL`. Fine.

### 4.2 Wrapper routes (`apps/api/src/routes/auth.ts`)

**Pattern: route validates → service does the transaction.**

```ts
authRoutes.post('/register-artist', async (c) => {
  const input = registerArtistSchema.parse(await c.req.json())
  const result = await AuthService.registerArtist(input)
  return c.json({ success: true, data: result })
})
```

### 4.3 Service (`apps/api/src/services/AuthService.ts` — new file)

Methods:

```ts
class AuthService {
  static async registerArtist(input: RegisterArtistInput): Promise<RegistrationResult>
  static async registerCaster(input: RegisterCasterInput): Promise<RegistrationResult>
}
```

Each does:

1. Call `auth.api.signUpEmail({ body: { email, password, name } })` — Better Auth creates `user` + `account`, sends verification email
2. In a `prisma.$transaction`:
   - Update `user.role` (`'artist'` or `'caster'`)
   - Create the matching `ArtistProfile` or `CasterProfile` shell with status `'pending_onboarding'` (artist) / `'active'` (caster)
   - Update `user.profileId` to the new profile's id
   - For artists: set `user.approvalStatus = 'pending'`
3. Return `{ user: { id, email }, verificationEmailSent: true }`

If step 1 succeeds and step 2 fails, the catch block must call `prisma.user.delete({ where: { id: userId } })` to roll back the orphan. Cascade deletes will clean up account + session rows.

### 4.4 EmailService methods (`apps/api/src/services/EmailService.ts`)

```ts
sendVerificationEmail({ to, verifyUrl }): Promise<void>
sendPasswordReset({ to, resetUrl }): Promise<void>
sendWelcomeEmail({ to, role, firstName }): Promise<void>  // after verify
```

Resend templates can be inline HTML strings for now — extract to MJML / react-email later.

### 4.5 Auth middleware (`apps/api/src/middleware/authenticate.ts`)

**Already scaffolded.** Verify it:

- Reads session via `auth.api.getSession({ headers: c.req.raw.headers })`
- Throws `AppError('UNAUTHORIZED', 'Not authenticated', 401)` if absent
- Throws `AppError('SUSPENDED', ...)` / `AppError('BANNED', ...)` if `user.status` is one of those
- Attaches `c.set('user', { id, role, profileId, approvalStatus, status })`

### 4.6 Profile cascade (Prisma)

Confirm `User → ArtistProfile` and `User → CasterProfile` relations exist with `onDelete: Cascade` — required for the rollback in 4.3 to be clean.

---

## 5. Frontend work

### 5.1 Pages (all exist as stubs)

| Route                     | Component work                                       | Form / data                                       |
| ------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `/register`               | Role chooser — "I'm a caster" / "I'm an artist"      | Client-side route picker                          |
| `/register/artist`        | Artist type picker (model / actor)                   | One radio, button → `/register/artist/model` etc. |
| `/register/artist/model`  | Full registration form                               | `useRegisterArtist` mutation                      |
| `/register/artist/actor`  | Full registration form (same fields)                 | `useRegisterArtist` mutation                      |
| `/register/caster`        | Caster registration form                             | `useRegisterCaster` mutation                      |
| `/verify-email`           | Display "Check your email" + resend button           | `useResendVerification`                           |
| `/verify-email/[token]`   | Server-side verify the token; render success/failure | Server action calling `/api/auth/verify-email`    |
| `/login`                  | Email + password form + social buttons               | `useLogin` mutation                               |
| `/forgot-password`        | Email field, success state                           | `useForgotPassword`                               |
| `/reset-password/[token]` | New password form                                    | `useResetPassword`                                |

### 5.2 Services (`apps/web/lib/api/auth.ts` — new)

```ts
export function registerArtist(input: RegisterArtistInput, init?): Promise<RegistrationResult>
export function registerCaster(input: RegisterCasterInput, init?): Promise<RegistrationResult>
export function login(input: LoginInput, init?): Promise<{ user: SessionUser }>
export function logout(init?): Promise<void>
export function forgotPassword(input: ForgotPasswordInput, init?): Promise<void>
export function resetPassword(input: ResetPasswordInput, init?): Promise<void>
```

All call `fetcher()` with the appropriate path. Pure framework-agnostic.

### 5.3 Hooks (`apps/web/lib/hooks/use-auth.ts` — new)

`useRegisterArtist`, `useRegisterCaster`, `useLogin`, `useLogout`, `useForgotPassword`, `useResetPassword`. Each wraps a service and handles toast + targeted invalidation (`['session']` on login/logout).

Better Auth's `authClient.useSession()` hook stays the canonical session reader for client components — do **not** duplicate it.

### 5.4 Post-login redirect helper

`apps/web/lib/auth-redirect.ts`:

```ts
export function postLoginPath(user: SessionUser): string {
  if (user.role === 'admin') return '/admin'
  if (user.role === 'caster') return '/caster/dashboard'
  // artist
  if (user.approvalStatus === 'approved') return '/artist/dashboard'
  return '/onboarding/pending'
}
```

Pure function — easy to unit-test.

---

## 6. Data flow

```
Register (artist):
  Web form → POST /api/v1/auth/register-artist
  → AuthService.registerArtist
    → auth.api.signUpEmail (Better Auth creates user + account)
    → prisma.$transaction { update user.role, create ArtistProfile, set user.profileId }
    → EmailService.sendVerificationEmail (via Better Auth's hook)
  ← { user: { id, email }, verificationEmailSent: true }
  → /verify-email screen

Verify email:
  User clicks magic link → /verify-email/[token]
  → GET /api/auth/verify-email?token=… (Better Auth)
  → user.emailVerified = true
  → redirect to /onboarding (artist) or /caster/dashboard

Login:
  Web form → POST /api/auth/sign-in/email (Better Auth)
  → session cookie set
  → frontend reads session via auth-server.ts proxy
  → postLoginPath(user) determines redirect
```

---

## 7. Test plan (TDD — RED then GREEN)

> **Coverage target:** 80%+ across the auth touchpoints.
> Write tests in this order. Each test is RED before its implementation is GREEN.

### 7.1 Validator tests — `packages/validators/src/auth.test.ts`

| #   | Test                                                         | Asserts                              |
| --- | ------------------------------------------------------------ | ------------------------------------ |
| V1  | `registerArtistSchema` rejects invalid email                 | error on `email`                     |
| V2  | `registerArtistSchema` rejects password without digit        | error on `password`                  |
| V3  | `registerArtistSchema` rejects password without special char | error on `password`                  |
| V4  | `registerArtistSchema` rejects password < 8 chars            | error on `password`                  |
| V5  | `registerArtistSchema` rejects `artistType` outside enum     | error on `artistType`                |
| V6  | `registerArtistSchema` trims firstName/lastName whitespace   | parsed result is trimmed             |
| V7  | `registerArtistSchema` accepts valid input                   | returns parsed `RegisterArtistInput` |
| V8  | `registerCasterSchema` rejects companyType outside enum      | error on `companyType`               |
| V9  | `registerCasterSchema` accepts all four companyType values   | each parses successfully             |
| V10 | `loginSchema` rejects empty password                         | error on `password`                  |
| V11 | `resetPasswordSchema` rejects weak password                  | error on `password`                  |
| V12 | `resetPasswordSchema` rejects missing token                  | error on `token`                     |
| V13 | `forgotPasswordSchema` rejects invalid email                 | error on `email`                     |

### 7.2 API integration tests — `apps/api/tests/auth/`

**Setup:** Each test runs against a real Hono `app.request()` call with a transactional DB (use `prisma.$transaction` + `Rollback` pattern, or `truncate` between tests).

| #   | File                      | Test                                                                       | Asserts                                                                                                    |
| --- | ------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| A1  | `register-artist.test.ts` | `POST /api/v1/auth/register-artist` with valid input → 200                 | response envelope, user row created, ArtistProfile created, `user.role === 'artist'`, `user.profileId` set |
| A2  | `register-artist.test.ts` | Duplicate email → 409 `EMAIL_TAKEN`                                        | error envelope, no second user created                                                                     |
| A3  | `register-artist.test.ts` | Weak password → 400 `VALIDATION_ERROR`                                     | `error.fields.password` populated                                                                          |
| A4  | `register-artist.test.ts` | Banned email re-register → 403 `BANNED`                                    | error envelope                                                                                             |
| A5  | `register-artist.test.ts` | Transaction rollback on profile-create failure → no orphan user            | user row absent after intentional profile-create failure                                                   |
| A6  | `register-artist.test.ts` | Verification email is dispatched (mocked Resend)                           | `EmailService.sendVerificationEmail` called once with correct email                                        |
| A7  | `register-caster.test.ts` | Valid caster signup → 200, CasterProfile created, `status='active'`        | same as A1 but for caster                                                                                  |
| A8  | `register-caster.test.ts` | Each `companyType` enum value accepted                                     | 4 parametrised cases                                                                                       |
| A9  | `login.test.ts`           | Login with valid credentials → 200, session cookie set                     | `Set-Cookie` header present, body `{success:true,data:{user}}`                                             |
| A10 | `login.test.ts`           | Login with wrong password → 401 `INVALID_CREDENTIALS`                      | error envelope                                                                                             |
| A11 | `login.test.ts`           | Login before email verified → 403 `EMAIL_NOT_VERIFIED`                     | error envelope                                                                                             |
| A12 | `login.test.ts`           | Login as suspended user → 403 `SUSPENDED`                                  | error envelope                                                                                             |
| A13 | `login.test.ts`           | Login as banned user → 403 `BANNED`                                        | error envelope                                                                                             |
| A14 | `logout.test.ts`          | Logout clears session cookie                                               | `Set-Cookie` with expired date / empty value                                                               |
| A15 | `forgot-password.test.ts` | Existing email → 200, reset email sent                                     | `EmailService.sendPasswordReset` called                                                                    |
| A16 | `forgot-password.test.ts` | Non-existent email → 200 with no email sent                                | **Always 200** (do not leak account existence)                                                             |
| A17 | `reset-password.test.ts`  | Valid token + strong password → 200, password updated, token invalidated   | login works with new password; old token rejected                                                          |
| A18 | `reset-password.test.ts`  | Expired token → 400 `INVALID_TOKEN`                                        | error envelope                                                                                             |
| A19 | `reset-password.test.ts`  | Weak new password → 400 `VALIDATION_ERROR`                                 | error envelope                                                                                             |
| A20 | `get-session.test.ts`     | Unauthenticated → 200, `data: null`                                        | matches auth-server.ts contract                                                                            |
| A21 | `get-session.test.ts`     | Authenticated → 200, returns user shape with role/profileId/approvalStatus | shape matches `SessionUser`                                                                                |

### 7.3 Frontend unit tests — `apps/web/`

| #   | File                                                         | Test                                                            | Asserts                                            |
| --- | ------------------------------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------- |
| W1  | `lib/auth-redirect.test.ts`                                  | `postLoginPath(admin)` → `/admin`                               | exact string match                                 |
| W2  | `lib/auth-redirect.test.ts`                                  | `postLoginPath(caster)` → `/caster/dashboard`                   |                                                    |
| W3  | `lib/auth-redirect.test.ts`                                  | `postLoginPath(artist, pending)` → `/onboarding/pending`        |                                                    |
| W4  | `lib/auth-redirect.test.ts`                                  | `postLoginPath(artist, rejected)` → `/onboarding/pending`       | rejected reuses pending screen with different copy |
| W5  | `lib/auth-redirect.test.ts`                                  | `postLoginPath(artist, approved)` → `/artist/dashboard`         |                                                    |
| W6  | `lib/api/auth.test.ts`                                       | `login()` calls fetcher with `/auth/sign-in/email`, method POST | mock `fetcher` and assert call                     |
| W7  | `lib/api/auth.test.ts`                                       | `registerArtist()` calls fetcher with correct path + body       |                                                    |
| W8  | `lib/api/auth.test.ts`                                       | All services accept and forward `signal`                        | abort propagates                                   |
| W9  | `lib/hooks/use-auth.test.tsx`                                | `useLogin` calls service, invalidates `['session']` on success  | RTL + queryClient                                  |
| W10 | `lib/hooks/use-auth.test.tsx`                                | `useLogin` surfaces ApiError message via toast                  | mock `sonner.toast.error`                          |
| W11 | `lib/hooks/use-auth.test.tsx`                                | `useLogout` invalidates `['session']` + redirects               |                                                    |
| W12 | `app/(public)/login/login-form.test.tsx`                     | Form rejects invalid email before submit                        | RHF validation, fetcher not called                 |
| W13 | `app/(public)/login/login-form.test.tsx`                     | Form submits valid input → fetcher called once                  |                                                    |
| W14 | `app/(public)/login/login-form.test.tsx`                     | Server-side `INVALID_CREDENTIALS` surfaces as inline error      |                                                    |
| W15 | `app/(public)/register/artist/[type]/register-form.test.tsx` | Password mismatch confirm field blocks submit                   | client-only mirror of confirm                      |
| W16 | `app/(public)/register/artist/[type]/register-form.test.tsx` | Successful submit redirects to `/verify-email`                  | mock router                                        |
| W17 | `app/(public)/register/caster/register-form.test.tsx`        | Same as W15/W16 for caster                                      |                                                    |

### 7.4 E2E — `tests/e2e/auth.spec.ts`

Run against real backend + frontend (turbo dev). Each test seeds + cleans its own user.

| #   | Test                                                      | Walks                                                                                                                       |
| --- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| E1  | Artist sign-up → verify email → onboarding pending screen | Register form → check verification email (intercept Resend or use a test SMTP) → click link → land on `/onboarding/pending` |
| E2  | Caster sign-up → verify email → caster dashboard          | Register → verify → `/caster/dashboard` reachable                                                                           |
| E3  | Login as unverified user → blocked                        | Sign up, attempt login without verifying → error message visible                                                            |
| E4  | Login redirects each role correctly                       | Three seeded users (admin / caster / approved artist) → each lands on right route                                           |
| E5  | Forgot password full loop                                 | Submit email → check reset email → click link → set new password → login with new password works, old does not              |
| E6  | Auth-guarded routes reject unauthenticated                | `/artist/dashboard`, `/caster/dashboard`, `/admin` all 307 → `/login` (regression test for what Phase 6 verified)           |
| E7  | Logout terminates session                                 | Login → logout → reload `/artist/dashboard` → redirected to login                                                           |

**Note on email interception:** Use Resend's test mode or a `RESEND_TEST_INBOX` flag in dev that swaps the SDK with an in-memory adapter that exposes `getLastEmail({ to })`. Wire this in EmailService when feature work begins.

---

## 8. Acceptance criteria

The feature is DONE when:

- [ ] All 13 validator tests pass
- [ ] All 21 API integration tests pass
- [ ] All 17 frontend unit tests pass
- [ ] All 7 E2E tests pass against real stack
- [ ] `bun run typecheck && bun run lint && bun run format:check && bun run test` all green
- [ ] `bun run test:e2e` green on chromium
- [ ] Coverage ≥ 80% for `services/AuthService.ts`, `lib/api/auth.ts`, `lib/hooks/use-auth.ts`, `lib/auth-redirect.ts`, `routes/auth.ts`
- [ ] A manual smoke through register-verify-login-logout works for both roles in a fresh browser
- [ ] An admin user can be seeded via `prisma/seed.ts` (for E2E + first manual approval workflows)
- [ ] CONTEXT.md updated with: feature 01 marked complete, every caveat encountered, env vars now actually required (BETTER_AUTH_SECRET, RESEND_API_KEY)

---

## 9. Dependencies on other features

**Blocks:** every other feature (no panel works without sessions).

**Depends on:** none — this is feature #1.

**Touches but does not implement:**

- Artist onboarding screens (`/onboarding/*`) — stubs exist; feature #2 fills them in
- Admin approval queue — feature #3 owns the actual approve/reject button; we just respect `approvalStatus` in the redirect

---

## 10. Open questions to resolve during the session

1. **Where does `firstName` / `lastName` live?** Better Auth's `user` table has a single `name` field. Either:
   - Store `firstName + ' ' + lastName` in `user.name`, also persist split form in `ArtistProfile.firstName/lastName` for display (preferred — display name is profile concern)
   - Add `firstName`/`lastName` to Better Auth's `additionalFields` (ties identity to display)

2. **`auth.api.signUpEmail()` from within a service** — Better Auth expects a Request-like object. Confirm we can pass `{ body: { ... }, headers: new Headers() }` directly without an actual HTTP roundtrip. If not, use a fetch shim against `localhost:3001/api/auth/sign-up/email`.

3. **Verification email URL format** — Better Auth defaults to a callback on the API host. We want the user clicking it to land on the **web** host (e.g. `${FRONTEND_URL}/verify-email/[token]`), which then calls back to the API. Configure `emailVerification.verificationUrl` accordingly.

4. **Social login: do we send Google's `state` through our own redirect?** Better Auth handles the OAuth dance; verify the final landing page lets us run `postLoginPath()` server-side before showing UI. May need a custom `signIn.social.callbackURL` per role-detection.

5. **Test DB strategy** — chose `prisma db push` over migrations in Phase 4. For tests we need isolation. Options:
   - Single DB, truncate between tests (fastest, requires careful ordering)
   - Schema-per-test (slowest, fully isolated)
   - Transactional rollback (Prisma 5+ supports this via `$transaction` with manual rollback)
   - **Recommendation:** truncate, with a `tests/helpers/db.ts` that resets each table in FK-safe order.

Resolve each before writing the corresponding test/implementation.
