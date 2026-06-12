# ASO Audit Agent

AI-powered Apple App Store optimization (ASO) audit tool. Paste an App Store URL, confirm
the matched app, and receive a comprehensive audit per-dimension scores, evidence-driven
recommendations, GPT-4o **vision** screenshot analysis, and competitor comparison with
live progress streamed to the UI as the workflow runs.

The UI is **chat-style**: a left sidebar lists your previous audits ("chats") and the main
panel reads as a conversation you paste a URL, the assistant replies with a confirmation
card, streams progress, then shows the report. History is persisted, so you can close the
tab and come back to past audits later.


Deployed Frontend URL: https://aso-audit-web.onrender.com
Deployed Backend URL: https://aso-audit-api.onrender.com


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
pnpm test         # run ALL tests (215): api + packages, then the web UI suite
pnpm test:api     # only the api + packages tests (Node env, 141 tests)
pnpm test:web     # only the web component + hook tests (jsdom, 74 tests)
pnpm test:watch   # api + packages tests in watch mode
```

The LLM is stubbed and the parser runs against a real captured Firecrawl fixture, so the
suite needs no network or API keys. The api/package tests run under Vitest's `node`
environment; the web tests (`apps/web`) run under `jsdom` with Testing Library via the
app's own `apps/web/vitest.config.mts`. `pnpm test` runs them in sequence it stops at the
first failing phase, so use `test:api` / `test:web` to target one suite.

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

Each bullet is **what I chose → why → the tradeoff**.

- **Two apps — a Next.js frontend and a NestJS backend — not a frontend-only app.** A
  server is required because: API keys (OpenAI, Firecrawl) must never reach the browser;
  protections like caching and rate-limiting can only be *enforced* server-side; and an
  audit is a long-running, multi-step job that needs a real, persistent process. The
  frontend stays a thin layer that just renders results.

- **A monorepo with small shared packages.** Domain types and pure logic live in `@aso/*`
  packages used by both apps, so the API and UI can't drift out of sync. The web app
  imports only types and pure helpers, which keeps the browser bundle free of any
  server/AI code.

- **Validate everything with Zod.** TypeScript types are generated *from* Zod schemas, and
  every input from the outside world is validated at runtime Apple, Firecrawl, the LLM,
  HTTP request bodies, even data read back out of the cache. If it doesn't match the
  schema, it doesn't enter the system.

- **Treat the AI as an unreliable, replaceable part.** Every model call goes through one
  interface (`AnalysisGateway`): production uses OpenAI, tests use a fake that returns fixed
  data so the whole flow runs with no API key or network. The model is forced to return
  JSON matching a schema, and we retry when it doesn't (common for apps with sparse data).

- **Many small analysis steps, run as a workflow — not one giant prompt.** Each part of the
  listing (title, subtitle, description, screenshots, reviews, competitors) is its own step.
  Independent steps run **in parallel** for speed, then scoring → recommendations → report
  run in order. If a step fails or data is missing, that dimension is scored conservatively
  with a warning — **the audit never crashes**.

- **Stream progress with SSE, not WebSockets.** Progress flows one way (server → browser),
  so the simpler tool wins: SSE is plain HTTP with built-in auto-reconnect and no special
  handshake, and the browser has native support (`EventSource`). Tradeoff: it's one-way and
  can't send custom headers which is fine here, since the client only *reads* progress. We'd switch
  to WebSockets only if the UI needed two-way interaction (e.g. cancelling a run).

- **Use the right data source for each field.** App metadata, screenshots, and ratings come
  from Apple's free iTunes Lookup API; reviews, subtitle, and competitors are scraped from
  the store page with Firecrawl (Apple doesn't expose those). If Firecrawl is down, the
  audit still finishes using Apple-only data.

- **Scores are out of 100.** The brief's ten dimension weights actually add up to 110, so we
  keep the given weights but normalize against their real total — the final score stays on a
  clean 0–100 scale. (Documented in `packages/core/src/constants/scoring.ts`.)

- **Keep the infrastructure simple, but swappable.** Audit state, the cache, and history use
  in-memory maps and a JSON file behind interfaces (`IAuditStore`, `ICacheStore`,
  `IConversationStore`) — no database, queue, or Redis. One server is enough today, and each
  piece can later be replaced with a real datastore without touching the code that uses it.

- **Cache results to save money.** A finished audit is cached per app (`appId:country`), so
  re-running the same app is instant and spends no tokens; identical in-flight requests share
  one run. A simple per-IP rate limit protects the expensive endpoints.

- **Saved, per-browser history (the "chat" sidebar).** Each audit is stored as a conversation
  and listed in the sidebar. History is tied to an anonymous browser id (no login) and
  persisted to a JSON file so it survives restarts. The chat bubbles are rebuilt from the
  saved `{ url, preview, report }`, so there's nothing extra to store.

## Notes

- Tests stub the LLM and use a captured Firecrawl fixture, so `pnpm test` needs no API keys
  and makes no network calls.
- Progress is streamed over SSE so the UI always shows which stage is running; a cache hit
  still produces a fully-ticked progress stream labelled "Served from cache".
