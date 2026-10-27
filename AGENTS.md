# AGENTS.md

This repo is the ASO audit monorepo for an AI-powered App Store optimization review app. See [README.md](README.md) for the full product description, deployment notes, and architecture rationale.

## High-level layout

- [apps/web](apps/web): Next.js chat UI with sidebar history and conversation rendering.
- [apps/api](apps/api): NestJS backend for previewing audits, starting long-running runs, SSE progress, caching, rate limits, and history persistence.
- [packages](packages): shared TypeScript packages used by both apps.

## Dependency direction and architecture

Respect the project’s layer boundaries:

- `schemas -> core -> prompts -> tools -> agents -> workflows`
- `apps/api` consumes the shared packages.
- `apps/web` should only import `@aso/schemas` types and pure helpers from `@aso/core`; it should not import server-side or AI code.

The codebase intentionally treats external inputs as untrusted and validates them with Zod before they enter the domain model. Keep that pattern when adding new code or endpoints.

## Commands

Use the repo scripts from the root:

```bash
pnpm install
pnpm dev          # build packages, then run api + web in parallel
pnpm build        # build every workspace package + app
pnpm typecheck    # strict tsc across all packages/apps
pnpm test         # run API/package tests then web tests
pnpm test:api     # API + package tests only
pnpm test:web     # web UI tests only
pnpm test:watch   # API + package tests in watch mode
```

Notes:

- Requires Node >= 20 and pnpm via Corepack.
- `pnpm dev` builds the shared packages first, then starts the API and web apps.
- If you edit files under [packages](packages), restart the dev process or run `pnpm build:packages`; the Nest watcher in [apps/api](apps/api) only watches its own source tree.
- The test environment is intentionally stubbed for LLM calls and uses a captured Firecrawl fixture, so the suite should not require network access or API keys.

## Code conventions

- Prefer the existing schema-first flow: validate external data with Zod, then map to internal domain types.
- Keep logic in shared packages when it is pure, reusable, or shared across the UI and API.
- Keep audit orchestration and long-running workflow logic in the back end or shared workflow packages, not the frontend.
- If a change alters a public contract, update the relevant schema and any dependent types before touching callers.
- Preserve the existing SSE-based progress stream and the cache/rate-limit behavior unless the task specifically requires a change to that design.

## When making changes

- Start from the closest package or app boundary that owns the behavior.
- Favor small, targeted edits over broad refactors.
- Verify with the most specific relevant command instead of running the full suite unnecessarily.
- For package-level changes, especially under [packages/core](packages/core), [packages/schemas](packages/schemas), [packages/workflows](packages/workflows), and [packages/tools](packages/tools), keep the dependency direction intact and avoid leaking API-specific code into the frontend.

## Useful references

- [README.md](README.md) for product context, architecture, and environment variables.
- [apps/api/package.json](apps/api/package.json) and [apps/web/package.json](apps/web/package.json) for app-specific scripts.
- [package.json](package.json) for the root workspace scripts.
