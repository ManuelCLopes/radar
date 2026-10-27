#!/usr/bin/env sh

set -eu

if [ "${VERCEL_ENV:-}" = "production" ] && [ "${VERCEL_GIT_COMMIT_REF:-}" != "main" ]; then
  echo "Blocked: production deploys are allowed only from 'main'."
  echo "Current branch: '${VERCEL_GIT_COMMIT_REF:-unknown}'."
  exit 1
fi

npm run build:client

# Apply pending migrations for production deploys only; previews must not
# change the shared database. A failed migration fails the deploy instead of
# shipping code that expects columns the database does not have.
if [ "${VERCEL_ENV:-}" = "production" ]; then
  if [ -n "${DATABASE_URL:-}" ]; then
    npx tsx scripts/migrate.ts
  else
    echo "Warning: DATABASE_URL is not available at build time; skipping migrations."
  fi
fi
