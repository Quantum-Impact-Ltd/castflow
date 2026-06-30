# CastFlow API — Railway/Docker image.
# Bun monorepo: install the whole workspace (the API depends on
# @castflow/types and @castflow/validators), generate the Prisma client, then
# run the entry TS directly (Bun executes TypeScript — no build step needed).
FROM oven/bun:1.3.11

WORKDIR /app

# Copy everything (node_modules / .next / dist are excluded via .dockerignore)
COPY . .

# Install workspace dependencies against the committed lockfile
RUN bun install --frozen-lockfile

# Generate the Prisma client for the API. Run through the workspace script
# (not `bunx prisma`, which fetches the LATEST Prisma — v7 drops `url=env()`
# in the schema) so the lockfile-pinned Prisma 5 binary is used.
RUN bun run --filter=@castflow/api db:generate

ENV NODE_ENV=production
# Railway injects PORT at runtime; the app reads it via env.PORT.
EXPOSE 3001

# Schema is synced via railway.json preDeployCommand (prisma db push); here we
# just start the server.
CMD ["bun", "run", "apps/api/src/index.ts"]
