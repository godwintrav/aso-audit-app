# ASO Audit Agent

AI-powered Apple App Store optimization (ASO) audit tool. Paste an App Store URL, confirm
the matched app, and receive a comprehensive audit per-dimension scores, evidence-driven
recommendations, GPT-4o **vision** screenshot analysis, and competitor comparison with
live progress streamed to the UI as the workflow runs.

The UI is **chat-style**: a left sidebar lists your previous audits ("chats") and the main
panel reads as a conversation you paste a URL, the assistant replies with a confirmation
card, streams progress, then shows the report. History is persisted, so you can close the
tab and come back to past audits later.

## Stack

- **Frontend**: Next.js (App Router), React, TailwindCSS, shadcn/ui-style components
- **Backend**: NestJS (data acquisition, REST endpoints, SSE streaming, orchestration)
- **AI**: Mastra (tools + workflow) + OpenAI GPT-4o (text) / GPT-4o vision (screenshots),
  via the Vercel AI SDK
- **Data**: iTunes Lookup API (metadata, screenshots, ratings) + Firecrawl (reviews,
  subtitle, What's New, competitors)
- **Monorepo**: pnpm workspaces, strict TypeScript, Zod everywhere, Vitest

## Architecture

```
apps/
  web/   Next.js chat UI (sidebar of past audits + conversation panel; no AI logic)
  api/   NestJS (AppStoreService, audit + conversation endpoints, SSE, orchestration,
         cache, rate limit, history persistence)
packages/
  schemas/   @aso/schemas  - Zod schemas + inferred domain types (single source of truth)
  core/      @aso/core      - scoring weights, stages, URL parsing, pure utils
  prompts/   @aso/prompts   - focused per-tool prompt builders + ASO framework knowledge
  agents/    @aso/agents    - AnalysisGateway seam (OpenAI impl + deterministic stub)
  tools/     @aso/tools     - Mastra createTool per analysis dimension
  workflows/ @aso/workflows - Mastra audit workflow (parallel analyses → score → recs → report)
```

Data flows **one way** and is normalized at the boundary: every external response (Apple,
Firecrawl, the LLM) is validated with Zod and mapped into the internal `AppListing` /
`AuditReport` domain models. The frontend only ever sees those domain types, never a raw
Apple/Firecrawl/LLM shape.

Dependency direction: `schemas → core → prompts → tools → agents → workflows`; `apps/api`
consumes the packages, `apps/web` imports only `@aso/schemas` **types** and `@aso/core`
pure utils.

## Setup

**Prerequisites:** Node ≥ 20 and pnpm (via Corepack).

```bash
corepack enable                 # provides pnpm 9
pnpm install

# Configure secrets: the repo-root .env is loaded by the API
cp .env.example .env            # then set OPENAI_API_KEY and FIRECRAWL_API_KEY

pnpm dev                        # builds packages, then runs api :3001 + web :3000
```

Open http://localhost:3000 and paste an App Store URL, e.g.
`https://apps.apple.com/us/app/uber-request-a-ride/id368677368`.

> **Dev caveat:** `pnpm dev` builds the `@aso/*` packages first, then runs the apps. The
> API uses `nest --watch`, which only watches `apps/api/src`, if you edit a file under
> `packages/*`, restart `pnpm dev` (or run `pnpm build:packages`) so the change is picked up.

### Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | ✅ | - | GPT-4o text + vision analysis |
| `FIRECRAWL_API_KEY` | ✅ | - | Scraping reviews / subtitle / competitors |
| `API_PORT` | | `3001` | API port |
| `WEB_ORIGIN` | | `http://localhost:3000` | Allowed CORS origin(s), comma-separated |
| `ASO_TEXT_MODEL` / `ASO_VISION_MODEL` | | `gpt-4o` | Model overrides |
| `CACHE_ENABLED` | | `true` | Toggle response caching |
| `CACHE_TTL_SECONDS` | | `86400` | Cache freshness (24h) |
| `CACHE_MAX_ENTRIES` | | `500` | Max cached apps before LRU eviction |
| `RATE_LIMIT_TTL_SECONDS` | | `60` | Rate-limit window |
| `RATE_LIMIT_MAX` | | `10` | Max write requests per IP per window |
| `HISTORY_PERSISTENCE` | | `file` | `file` (survives restarts) or `memory` |
| `CONVERSATIONS_FILE` | | `./data/conversations.json` | Where history is stored (file mode) |
| `CONVERSATIONS_MAX_PER_SESSION` | | `50` | Max past audits kept per session (oldest evicted) |

## Scripts

```bash
pnpm dev          # build packages, then run api + web in parallel
pnpm build        # build every workspace package + app
pnpm typecheck    # strict tsc across all packages/apps
pnpm test         # Vitest: 66 tests; the LLM is stubbed and the parser
                  # runs against a real captured Firecrawl fixture (no network/keys needed)
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/audit/preview` | Resolve a URL to confirmation-card data |
| POST | `/audit/run` | Start a full audit, returns `{ auditId }` |
| GET | `/audit/:id` | Fetch audit status / final report |
| GET | `/audit/:id/stream` | Server-Sent Events progress stream |
| GET | `/conversations` | List the session's past audits (sidebar) |
| GET | `/conversations/:id` | Fetch one past audit (to re-render its report) |
| DELETE | `/conversations/:id` | Delete a past audit |

- `POST` bodies are `{ url: string, refresh?: boolean }`; `refresh: true` bypasses and
  overwrites the cache.
- **`X-Session-Id`** header: an anonymous per-browser id (the web app generates and stores
  it in `localStorage`). It scopes audit history; `/audit/run` records the run under it, and
  the `/conversations` endpoints only return that session's audits.
- `/audit/preview` returns an `X-Cache: HIT | MISS` header.
- Write endpoints (`/audit/run`, `/audit/preview`) are rate-limited per IP (`429` +
  `Retry-After` when exceeded); the stream, status, and conversation endpoints are not.
- Validation: a malformed/non-App-Store URL or bad `:id` returns `400`; an unknown (but
  well-formed) audit/conversation id returns `404`.

## Key decisions & tradeoffs

- **Zod as the single source of truth.** Domain types are inferred from Zod schemas, and
  every boundary is validated at runtime: Apple/Firecrawl responses, LLM output, request
  DTOs, and even values read back out of the cache. Nothing untyped enters the system.
- **The LLM is an unreliable, swappable dependency.** All model calls go through one
  `AnalysisGateway` seam: a real OpenAI implementation in production and a deterministic
  stub in tests (so the full workflow runs offline, no key or network). Structured output
  is schema-constrained via the AI SDK, and the gateway retries responses that fail schema
  validation (common on data-sparse apps).
- **Specialized tools + a Mastra workflow, not one mega-prompt.** Independent analyses
  (title, subtitle, description, screenshots, reviews, competitors) run **in parallel**,
  then scoring → recommendations → assembly run in sequence. A failed stage or missing
  source data **degrades gracefully** (the dimension is scored conservatively with a
  warning) rather than aborting the audit.
- **Right data source per field.** Metadata/screenshots/ratings come from the free iTunes
  **Lookup** API (the brief's "Apple Search API"); subtitle and the keyword field aren't
  public, so subtitle is parsed from the Firecrawl markdown and the keyword field is scored
  heuristically. If Firecrawl is unavailable the audit still completes on Apple-only data.
- **Scoring normalized to /100.** The brief's ten dimension weights sum to 110; we keep the
  listed weights as the source of truth and normalize against their real total, documented
  in `packages/core/src/constants/scoring.ts`.
- **Simplicity over premature infra.** State (audit records, cache) lives in in-memory
  stores behind interfaces (`IAuditStore`, `ICacheStore`), no queues, Redis, or workers,
  so a single node is enough today and a distributed backend can be dropped in later with
  zero call-site changes.
- **Caching to save tokens.** Reports/listings/previews are cached by `appId:country` with
  TTL + LRU and single-flight de-duplication, so re-auditing the same app is instant and
  spends nothing. Rate limiting uses the official `@nestjs/throttler` (kept deliberately
  simple).
- **Chat history = persisted, session-scoped conversations.** Each audit is saved as one
  "conversation" (id = auditId) behind a swappable `IConversationStore` (default: a JSON
  file with atomic write-through, validated on load, survives restarts; `memory` mode and a
  future DB are drop-in). History is scoped by an anonymous `X-Session-Id` (no auth), which
  maps cleanly to real accounts later; the chat "messages" are derived on the client from
  the conversation's `{ url, preview, report }`, so there's nothing extra to store.
- **Package boundaries are deliberate.** Splitting `schemas`/`core` out keeps the web
  bundle free of server/LLM dependencies (it imports only pure types + utils) and enforces
  the layering: a package can only import what it declares.

## Notes

- Tests stub the LLM and use a captured Firecrawl fixture, so `pnpm test` needs no API keys
  and makes no network calls.
- Progress is streamed over SSE so the UI always shows which stage is running; a cache hit
  still produces a fully-ticked progress stream labelled "Served from cache".
