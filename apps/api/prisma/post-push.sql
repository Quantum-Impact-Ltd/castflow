-- One-off SQL to run after every `prisma db push`. Prisma's schema language
-- doesn't model CHECK constraints, so any DB-level invariants that aren't
-- expressible as FKs or @@unique live here.
--
-- Apply with:
--   psql "$DATABASE_URL" -f apps/api/prisma/post-push.sql
-- or via Prisma:
--   bun -e "import('./src/lib/prisma').then(async ({prisma}) => { \
--     for (const stmt of await Bun.file('prisma/post-push.sql').text()) await prisma.\$executeRawUnsafe(stmt); \
--     process.exit(0); })"
--
-- All statements are idempotent: DROP … IF EXISTS before ADD.

-- Reviews: exactly one of (artist_reviewee_id, caster_reviewee_id) must be
-- non-null. Replaces the previous dual-FK design that made every insert
-- fail with P2003 in production.
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_exactly_one_reviewee;
ALTER TABLE reviews ADD CONSTRAINT reviews_exactly_one_reviewee
  CHECK ((artist_reviewee_id IS NOT NULL)::int + (caster_reviewee_id IS NOT NULL)::int = 1);
