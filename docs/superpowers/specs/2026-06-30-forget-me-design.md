# forget-me — System Design & Decomposition

**Date:** 2026-06-30
**Status:** Approved design (pending user spec review)
**Author:** Dalton Redden + Claude

---

## 1. What this is

forget-me is a privacy-first tool that (a) helps a person discover where their email
address is registered, (b) sends real, legally-worded GDPR/CCPA/LGPD/PIPEDA deletion
**emails** on their behalf once they've proven they control that email, and (c) tracks
the responses. A free tier offers discovery + a catalog of curated manual deletion
guides + a CLI; a paid tier ($12/mo, $99/yr, $199 lifetime) adds automated sending,
a tracking dashboard, and monthly PDF reports.

This document is the **decomposed** design. The original megaprompt describes ~8
milestones spanning roughly 1–2 weeks of work. Rather than one monolithic plan, the
system is split into independently buildable, independently verifiable sub-projects
(Section 6). Each sub-project gets its own implementation plan and build/verify cycle.

## 2. Safety & legal design decisions (binding)

These decisions deliberately diverge from the original megaprompt. They are what make
the product legitimate rather than an abuse vector.

1. **No third-party account enumeration.** The megaprompt's "password-reset probing" of
   Spotify/GitHub/Google/etc. to detect accounts is dropped. It is enumeration against
   services we don't control, against their ToS. Discovery uses only: HIBP breach data,
   public GitHub/commit signals, and **user self-selection** from the guide catalog.

2. **Email-ownership verification gates all sending.** No deletion request is sent for an
   address until the owner clicks a signed confirmation link delivered to that address.
   A logged-in user's own Clerk-verified email is auto-trusted; any *other* address they
   enter must be verified. This is the single most important anti-abuse control: it
   prevents a malicious actor from firing deletion demands at a victim's accounts.

3. **No server-side headless-browser form impersonation.** The megaprompt's Playwright
   form-automation (submitting forms *as the user* on third-party sites) is dropped. It
   circumvents the sites' own access controls / bot detection / ToS. Instead:
   - **Email-channel services:** we send the deletion email from our server (legitimate;
     email is not access-controlled; the verified owner authorized it).
   - **Form-only services:** we pre-fill the request and hand the user a **one-click path
     in their own browser** (deep link + copy-ready packet) which they submit in their own
     session. Their interaction, their click — not our bot.

4. **No fictional "API deletion."** The megaprompt's example endpoints
   (`api.stripe.com/v1/customers/email_delete`, `DELETE /user` on GitHub) do not exist.
   We do not stub fake API calls. Real channels are: email, and user-submitted form/guide.
   The `method` enum is therefore `email | user_form | manual_only` (no `api_call`).

5. **Honest discovery claims.** "8,000+ services discoverable" is marketing. Realistic
   automated discovery = HIBP + public search; the rest is user-declared from the catalog.
   UI copy will not overstate automated coverage.

6. **Privacy invariants** (unchanged from megaprompt, kept): never store passwords or 2FA;
   never open authenticated sessions to third parties; email retained in findings only
   with a 30-day retention policy; deletion-request records store status/timestamps, not
   sensitive content; secrets via env only.

## 3. Tech stack

- Runtime **Bun 1.3.x**; API **Hono**; Frontend **Next.js 15 (App Router)**.
- DB **PostgreSQL 15+** with **Drizzle ORM**.
- **Tailwind v4 + shadcn/ui**; design tokens: bg `#0f0f0f`, accent `#f59e0b`, Inter +
  JetBrains Mono, flat, no border-radius.
- CLI: Bun + **commander.js**.
- Auth **Clerk** (email + GitHub/Google OAuth); Payments **Stripe Billing**;
  Transactional email **Resend**. All three are **env-gated**: absent keys → feature
  degrades (free-tier-only locally, sending disabled) rather than crashing.
- Deploy: **Vercel** (web). API target: Fly.io in the megaprompt; for v1 we deploy the
  Hono API as Vercel functions co-located unless a long-running worker forces Fly.io
  (decided per sub-project; tracking/retry cron may need Fly.io).

## 4. Monorepo layout

```
forget-me/
├── packages/
│   ├── shared/   # TS types + zod schemas shared across api/web/cli
│   ├── api/      # Hono server, routes, services, db (Drizzle), migrations
│   ├── web/      # Next.js 15 app
│   └── cli/      # commander.js CLI
├── guides/       # 40 YAML deletion guides (v1), seed source of truth
├── docs/
├── .github/workflows/
├── .env.example
└── README.md
```

Bun workspaces. `shared` is the single source of truth for cross-package types; `api`
owns the Drizzle schema and re-exports inferred types into `shared`.

## 5. Data model (delta from megaprompt)

Adopt the megaprompt's Drizzle schema with these changes driven by Section 2:

- `deletion_requests.method` enum: `email | user_form | manual_only` (drop `api_call`,
  `form_submission`).
- New table `email_verifications`: `{ id, email, token_hash, purpose, expires_at,
  verified_at, created_at }`. A request may only transition to `sent` if a matching
  `verified_at` exists (or the email equals a signed-in user's Clerk-verified email).
- `deletion_request_templates`: keep email-template fields; drop API/`form_automation`
  endpoint columns, add `user_form_url` + `user_form_fields` (for the one-click packet).
- Everything else (users, subscriptions, deletion_guides, search_findings, contributions,
  userDeletionJobs, apiUsage) per megaprompt.

## 6. Decomposition into sub-projects

Each is an independently shippable unit with its own plan + verification. Build order:

- **SP-1 — Foundation.** Monorepo, Bun workspaces, `shared` types/zod, Drizzle schema +
  migrations, `.env.example`, README stub, GitHub repo, CI skeleton.
  *Verify:* `bun run db:migrate` creates all tables; `psql \dt` lists them.

- **SP-2 — Guides catalog.** 40 YAML guides + validator + seed script + findings→guide
  matcher. *Verify:* seed loads ≥40 rows; `GET /api/guides/github` returns steps.

- **SP-3 — Discovery.** HIBP client (env-gated, rate-limited 6/35s), public GitHub search,
  self-selection intake, parallel orchestrator with timeouts. *Verify:* discovery test
  returns findings from HIBP (when key present) + public search; graceful skip without key.

- **SP-4 — Core API.** `POST /api/search` (async jobs), `GET /api/findings/:jobId`,
  guides list/detail/contribute, `GET /api/stats`; validation, rate limiting, logging.
  *Verify:* curl search → job_id/processing; poll → findings.

- **SP-5 — Verification + sending.** `email_verifications` flow (signed token, Resend),
  per-jurisdiction email templates (GDPR/CCPA/LGPD/PIPEDA), `POST /api/request/send`
  (gated), one-click packet generator for `user_form`, status/retry/verify endpoints,
  retry w/ exponential backoff. *Verify:* send blocked until verified; verified email
  fires a real Resend email (test mode); status reflects transitions.

- **SP-6 — Auth + payments.** Clerk integration + webhook, user upsert + free tier init,
  Stripe checkout/subscription/cancel/webhook, env-gated. *Verify:* signup creates
  free-tier user row; checkout session URL returned; webhook upgrades tier.

- **SP-7 — Frontend.** Next.js pages: `/`, `/pricing`, `/auth/*`, `/dashboard`,
  `/account/*`, `/search`+results (with verify-gated auto-send), `/track/[jobId]`,
  `/guides`, `/guide/[id]`, `/contribute`, `/stats`. Dark+amber theme, responsive.
  *Verify:* core flows click through against the API.

- **SP-8 — CLI.** `search`, `guides`, `guide`, `request-send`, `request-status`,
  `request-retry`, `request-verify`, `track`, `export`, `export-requests`, version/help,
  `~/.forgetme/config.json`. *Verify:* each command runs against the API.

- **SP-9 — Test, harden, deploy, docs.** Bun tests (unit/integration/e2e), Bruno
  collection, security checklist, README/CONTRIBUTING/OpenAPI, Docker Compose self-host,
  GitHub Actions, Vercel deploy (+ Fly.io for API/cron if needed).
  *Verify:* `bun run test` green; deployed `/api/stats` + home load.

## 7. Explicitly NOT built (and why)

- Password-reset probing discovery — third-party enumeration (§2.1).
- Server-side headless form submission — circumvents site controls (§2.3).
- "API deletion" against fabricated endpoints — they don't exist (§2.4).
- Unverified deletion sending — impersonation/abuse vector (§2.2).

## 8. External dependencies / keys required (env-gated)

`DATABASE_URL`, `HIBP_API_KEY`, `RESEND_API_KEY`, `CLERK_*`, `STRIPE_*`, `GITHUB_TOKEN`
(for public search rate limits). All optional locally; features degrade cleanly when absent.

## 9. Open questions

- API hosting: Vercel functions vs Fly.io — decide at SP-4/SP-5 based on whether
  retry/verification monitoring needs a long-running worker.
- Stripe price IDs / Clerk app: created when SP-6 starts (need your accounts).
