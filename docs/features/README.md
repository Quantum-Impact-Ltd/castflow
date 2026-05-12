# CastFlow — Feature Specs

Per-feature implementation briefs. Each spec is the source of truth for **one vertical slice** — API + web + tests.

## How to use this

- **Read order at session start:** `CONTEXT.md` (overall state) → the feature doc you're about to work on → relevant CLAUDE.md files.
- **Test-driven:** every spec ends with a numbered test plan. Write the tests RED first, then make them GREEN. Do not skip.
- **Update on done:** when a feature is shipped, mark the status in the doc header AND update `CONTEXT.md`.

## Build order

Aligned with `CONTEXT.md` "Next up". Each row links to its spec once written.

| #   | Feature                                                          | Spec                       | Status         |
| --- | ---------------------------------------------------------------- | -------------------------- | -------------- |
| 1   | Auth flows                                                       | [01-auth.md](./01-auth.md) | 🟡 Not started |
| 2   | Artist onboarding (model + actor, ID upload, admin queue submit) | —                          | ⬜             |
| 3   | Admin: artist application queue                                  | —                          | ⬜             |
| 4   | Caster: post a job (6-step wizard, both payment types)           | —                          | ⬜             |
| 5   | Artist: job feed (browse, filter, view detail)                   | —                          | ⬜             |
| 6   | Artist: submit a bid                                             | —                          | ⬜             |
| 7   | Caster: bid management (shortlist / reject / accept)             | —                          | ⬜             |
| 8   | Booking flow (Stripe escrow payment)                             | —                          | ⬜             |
| 9   | Contract generation + e-signature                                | —                          | ⬜             |
| 10  | Post-shoot: completion + escrow release                          | —                          | ⬜             |
| 11  | Reviews (both directions)                                        | —                          | ⬜             |
| 12  | Disputes (raise + admin resolution)                              | —                          | ⬜             |
| 13  | Messaging (WebSocket + persisted threads)                        | —                          | ⬜             |
| 14  | Notifications (email triggers per event)                         | —                          | ⬜             |
| 15  | Admin: full dashboard                                            | —                          | ⬜             |

## Spec template

Every feature doc follows the same headings. When starting a new feature, copy `01-auth.md` as a scaffold and rename.

```
# Feature NN — <name>
Status / Build order / Estimated scope / Owners

1. Scope (In / Out / Hard business rules)
2. API contract (Better Auth handled vs Castflow wrappers, error codes)
3. Validators (which schemas, what they enforce)
4. Backend work (lib changes, routes, services, middleware, schema/migration)
5. Frontend work (pages, services in lib/api/, hooks, helpers)
6. Data flow (per primary user journey)
7. Test plan (validator unit / API integration / web unit / E2E — numbered)
8. Acceptance criteria (concrete checklist incl. green CI)
9. Dependencies on other features (Blocks / Depends on / Touches)
10. Open questions to resolve during the session
```

## TDD discipline

- Red before green. Write the failing test, then the implementation.
- Tests live next to or near the code:
  - API: `apps/api/tests/<feature>/<endpoint>.test.ts`
  - Web unit: co-located `*.test.{ts,tsx}` beside source
  - Validators: co-located `*.test.ts`
  - E2E: `tests/e2e/<feature>.spec.ts`
- Coverage target: 80% per file for the feature surface.
- Don't write tests for things the test plan doesn't list — if you find a missing case, **add it to the spec first**, then write the test.
