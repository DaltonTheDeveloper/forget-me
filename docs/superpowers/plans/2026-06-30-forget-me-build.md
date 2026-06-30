# forget-me Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans / subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the forget-me monorepo (API + web + CLI + guides) per the approved design, as a polished open-source project.

**Architecture:** Bun-workspace monorepo. `shared` holds TS types + zod. `api` (Hono) owns Drizzle schema, discovery, verification-gated sending, guides. `web` (Next.js 15) is the UI. `cli` (commander) wraps the API. Guides are YAML, seeded to Postgres.

**Tech Stack:** Bun 1.3, Hono, Next.js 15, Drizzle + Postgres, Tailwind v4 + shadcn/ui, commander, Clerk, Stripe, Resend.

## Global Constraints

- **NEVER commit secrets.** `.env`, `.env.local`, `.env.*` are gitignored; only `.env.example` is committed.
- Bun >= 1.3. Node-free where possible.
- Design tokens: bg `#0f0f0f`, accent amber `#f59e0b`, Inter + JetBrains Mono, flat, no border-radius.
- Safety invariants (binding): no third-party account enumeration; email-ownership verification gates all sending; no server-side headless form impersonation; no fictional API-deletion calls; `deletion_requests.method ∈ {email, user_form, manual_only}`.
- Env-gated external services degrade cleanly when keys absent (free-tier/local works).
- License: MIT. Conventional-commit messages. Commit per sub-project.

---

## SP-1 Foundation

**Files:** root `package.json`, `bunfig.toml`, `tsconfig.base.json`, `.gitignore`, `.env.example`, `LICENSE`, `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `.github/workflows/ci.yml`, `packages/shared/*`, `packages/api/{package.json,drizzle.config.ts,src/db/schema.ts,src/db/index.ts}`.

- [ ] Root workspace `package.json` with `workspaces: ["packages/*"]` and scripts (`db:migrate`, `db:seed:guides`, `api:dev`, `web:dev`, `cli`, `test`).
- [ ] `shared` package: zod schemas + inferred types for findings, guides, requests, jurisdictions.
- [ ] `api` Drizzle schema (megaprompt schema + Section-5 deltas: `email_verifications` table, method enum, template deltas), `drizzle.config.ts`, db client.
- [ ] `.env.example` documenting every key. `.gitignore` excludes `.env*` except `.env.example`.
- [ ] Open-source docs: MIT LICENSE, README (badges, overview, privacy stance, quickstart, self-host), CONTRIBUTING, CODE_OF_CONDUCT, SECURITY.
- [ ] CI: GitHub Actions running `bun install` + typecheck + test.
- [ ] **Verify:** `bun install` ok; `bunx tsc --noEmit` on shared; migration SQL generates.
- [ ] Commit; create GitHub repo (public, MIT) under DaltonTheDeveloper; push.

## SP-2 Guides catalog

- [ ] 40 YAML guides in `guides/` (the 40 services listed in the spec), each with service/deletion metadata + steps + deletion_request (email recipient + template where known, else manual_only).
- [ ] Guide zod validator + `bun run db:seed:guides` loader + findings→guide matcher.
- [ ] **Verify:** seed loads ≥40 rows; matcher maps "GitHub" → guide.

## SP-3 Discovery

- [ ] HIBP client (env-gated `HIBP_API_KEY`, 6req/35s limiter), public GitHub search client, self-selection intake, parallel orchestrator w/ per-source timeout + graceful skip.
- [ ] **Verify:** orchestrator returns merged findings; runs with HIBP absent.

## SP-4 Core API

- [ ] Hono app: `POST /api/search` (async job store), `GET /api/findings/:jobId`, `GET /api/guides` + `/:id`, `POST /api/guides/contribute`, `GET /api/stats`; zod validation, IP rate limit, request logging (no email in logs).
- [ ] **Verify:** curl search → job_id; poll → findings; guides endpoints return data.

## SP-5 Verification + sending

- [ ] `email_verifications` flow: `POST /api/verify/start` (Resend signed token), `GET /api/verify/confirm`. Per-jurisdiction templates (GDPR/CCPA/LGPD/PIPEDA). `POST /api/request/send` — **rejects unless email verified or matches signed-in Clerk email**. `user_form` one-click packet generator. status/retry/verify endpoints + exponential backoff.
- [ ] **Verify:** send blocked pre-verification; post-verification fires Resend (test); status transitions tracked.

## SP-6 Auth + payments (env-gated)

- [ ] Clerk middleware + webhook (user upsert, free-tier init). Stripe checkout/subscription/cancel/webhook. Tier gating on send/dashboard.
- [ ] **Verify:** signup → free user row; checkout URL returned; webhook upgrades tier; all no-op cleanly without keys.

## SP-7 Frontend (Next.js 15)

- [ ] Pages: `/`, `/pricing`, `/auth/signin`, `/auth/signup`, `/dashboard`, `/account/profile`, `/account/billing`, `/search` + results (verify-gated auto-send dialog), `/track/[jobId]`, `/guides`, `/guide/[id]`, `/contribute`, `/stats`. shadcn/ui, dark+amber, responsive.
- [ ] **Verify:** flows click through against API; `bun run web:dev` clean.

## SP-8 CLI

- [ ] commander CLI: `search`, `guides`, `guide`, `request-send`, `request-status`, `request-retry`, `request-verify`, `track`, `export`, `export-requests`, version/help, `~/.forgetme/config.json`.
- [ ] **Verify:** commands run against API with formatted output.

## SP-9 Test, harden, deploy, docs

- [ ] Bun unit/integration/e2e tests, Bruno collection, security checklist, OpenAPI, Docker Compose self-host, finalize CI, deploy web to Vercel.
- [ ] **Verify:** `bun run test` green; deployed home + `/api/stats` respond.

## Self-Review

- Spec coverage: SP-1..9 map 1:1 to design Section 6. ✓
- Placeholder scan: deliverables concrete; content generated at execution. ✓
- Type consistency: `shared` is the single type source; method enum fixed in Global Constraints. ✓
