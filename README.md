<div align="center">

# forget-me

**Find where your email is registered. Send real deletion requests. Track the responses.**
**Without ever touching your accounts.**

[![License: MIT](https://img.shields.io/badge/License-MIT-f59e0b.svg)](./LICENSE)
[![Built with Bun](https://img.shields.io/badge/built%20with-Bun-000000.svg)](https://bun.sh)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-f59e0b.svg)](./CONTRIBUTING.md)

</div>

---

## What it does

Your email address is connected to dozens — sometimes hundreds — of services. You have a
legal right to have that data deleted (GDPR Article 17, CCPA §1798.100, LGPD, PIPEDA). But
finding every service and contacting each one is tedious. **forget-me** does the legwork:

1. **Discover** — find services tied to your email via [Have I Been Pwned](https://haveibeenpwned.com)
   breach data, public sources, and a community catalog of 500+ services.
2. **Verify** — prove you own the email with a one-click confirmation link.
   *No deletion request is ever sent until you do.*
3. **Send** — we email legally-worded deletion requests to each service's privacy contact,
   in the correct language for your jurisdiction.
4. **Track** — watch responses come in, retry failures, and export proof of every request.

For services that only accept web forms, forget-me hands you a **pre-filled one-click link
you submit yourself** — your click, your browser session.

## What it deliberately does **not** do

forget-me is built privacy-first and abuse-resistant. By design it will never:

- ❌ Ask for, store, or transmit your passwords or 2FA codes.
- ❌ Log into your accounts or open authenticated sessions on your behalf.
- ❌ Probe third-party services to "guess" whether you have an account (no enumeration).
- ❌ Send a deletion request for an email you haven't **verified you control**.
- ❌ Run a headless browser to submit forms *impersonating you* on other sites.

Read the full reasoning in [`docs/superpowers/specs/2026-06-30-forget-me-design.md`](./docs/superpowers/specs/2026-06-30-forget-me-design.md).

## How it works

```
┌──────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Web UI  │     │   CLI (Bun)      │     │   Discovery         │
│ Next.js  │────▶│   commander.js   │────▶│  • HIBP (opt-in key)│
└──────────┘     └──────────────────┘     │  • Public search    │
      │                   │               │  • Self-selection   │
      └─────────┬─────────┘               └─────────────────────┘
                ▼                                    │
        ┌───────────────────────────────────────────┴───────┐
        │           Hono API (Bun)                           │
        │  /search  /findings  /guides  /stats               │
        │  /verify/start  /verify/confirm   ← ownership gate  │
        │  /request/send (gated)  /request/status            │
        └───────────────┬───────────────────────────────────┘
                        ▼
        ┌───────────────────────────┐   ┌──────────────────┐
        │ PostgreSQL + Drizzle      │   │ Resend (email)   │
        │ guides · findings ·       │   │ GDPR/CCPA/LGPD   │
        │ requests · verifications  │   │ templates        │
        └───────────────────────────┘   └──────────────────┘
```

## Quickstart

Requires [Bun](https://bun.sh) ≥ 1.3 and PostgreSQL ≥ 15.

```bash
git clone https://github.com/DaltonTheDeveloper/forget-me.git
cd forget-me
bun install
cp .env.example .env        # fill in DATABASE_URL (rest is optional)

bun run db:migrate          # create tables
bun run db:seed:guides      # load deletion guides

bun run api:dev             # API on :3001
bun run web:dev             # web on :3000
```

Try the CLI:

```bash
bun run cli search you@example.com
bun run cli guides --difficulty easy
```

> Every external integration (HIBP, Resend, Clerk, Stripe) is **optional**. With only a
> database, discovery + the guide catalog + the CLI all work. Add keys to unlock sending,
> auth, and payments.

## Project layout

```
packages/
  shared/   shared TypeScript types + zod schemas
  api/      Hono server, Drizzle schema, discovery, verification + sending
  web/      Next.js 15 app (App Router)
  cli/      commander.js CLI
guides/     YAML deletion guides (seed source of truth)
docs/       design specs + plans
```

## Pricing (hosted)

forget-me is **free and open source** — self-host the whole thing forever. The hosted
service adds convenience tiers (automated sending, tracking dashboard, monthly reports):
Free · Monthly $12 · Annual $99 · Lifetime $199. See [`/pricing`](packages/web).

## Contributing

Deletion guides are community-maintained — adding one is the easiest first PR. See
[CONTRIBUTING.md](./CONTRIBUTING.md). Found a security issue? See [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © Dalton Redden and contributors.
