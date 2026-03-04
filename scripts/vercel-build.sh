#!/usr/bin/env sh

set -eu

if [ "${VERCEL_ENV:-}" = "production" ] && [ "${VERCEL_GIT_COMMIT_REF:-}" != "main" ]; then
  echo "Blocked: production deploys are allowed only from 'main'."
  echo "Current branch: '${VERCEL_GIT_COMMIT_REF:-unknown}'."
  exit 1
fi

npm run build:client
