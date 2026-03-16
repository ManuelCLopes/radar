# Contributing

Thanks for contributing to Competitor Watcher.

## Before You Start

- Read [README.md](./README.md) for project overview and deployment notes.
- Read [SECURITY.md](./SECURITY.md) before reporting vulnerabilities.
- Keep changes focused. Small PRs are easier to review and safer to merge.

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Useful commands:

```bash
npm run check
npm test
npm run build
```

## Development Expectations

- Do not commit secrets, API keys, database dumps, or `.env` files.
- Prefer tests for behavioral changes, especially auth, billing, and data access.
- Keep translations in sync when changing user-facing copy.
- Update docs when environment variables, setup steps, or deployment behavior change.

## Pull Requests

Before opening a PR:

1. Rebase on `main`.
2. Run the relevant checks locally.
3. Describe the user impact, risk, and validation in the PR body.

PRs should include:

- a concise title
- a summary of the change
- testing notes
- screenshots for UI changes when useful

## Commit Messages

This repository uses conventional commits via commitlint. Use messages such as:

- `fix: correct OAuth callback handling`
- `docs: add security policy`
- `test: cover auth rate limiting`

## Security Changes

If your change affects auth, sessions, secrets, billing, or user data:

- call out the risk explicitly in the PR
- add or update tests
- avoid weakening production defaults
