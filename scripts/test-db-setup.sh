#!/usr/bin/env bash
# Bootstrap the local Postgres test DB. Idempotent — re-run any time.
#
#   1. Ensure docker compose is reachable
#   2. Start the `postgres` service (no-op if already up)
#   3. Wait for healthcheck (pg_isready)
#   4. Sync the Prisma schema via `prisma db push`
#   5. Apply post-push.sql for the CHECK constraints Prisma can't emit
#
# Usage:
#   ./scripts/test-db-setup.sh
#
# Tear-down:
#   docker compose down -v   # wipes the schema too

set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null; then
  echo "docker not found — install Docker Desktop or Docker Engine first." >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin not found — install docker-compose-plugin." >&2
  exit 1
fi

echo "▶ Starting postgres container…"
docker compose up -d postgres

echo "▶ Waiting for postgres to be ready…"
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U castflow -d castflow_test >/dev/null 2>&1; then
    echo "  postgres is ready."
    break
  fi
  sleep 1
done

echo "▶ Pushing Prisma schema…"
# Prisma's CLI reads .env by default and ignores NODE_ENV layering, so we
# pass DATABASE_URL inline to override the alwaysdata value with the local
# Postgres URL from .env.test.
(cd apps/api \
  && DATABASE_URL="postgresql://castflow:castflow_test@localhost:5436/castflow_test?sslmode=disable" \
     NODE_ENV=test bun prisma db push --skip-generate --accept-data-loss)

echo "▶ Applying post-push.sql (CHECK constraints)…"
docker compose exec -T postgres psql -U castflow -d castflow_test \
  < apps/api/prisma/post-push.sql

echo "✔ Local test DB ready at postgresql://castflow:castflow_test@localhost:5436/castflow_test"
echo "  Run the test suite: cd apps/api && bun test"
