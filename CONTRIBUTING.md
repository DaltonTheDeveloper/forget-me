# Contributing to forget-me

Thanks for helping people take back control of their data. 💛

## Ways to contribute

- **Add or fix a deletion guide** — the highest-impact, easiest contribution.
- **Improve discovery, the API, the web app, or the CLI.**
- **File issues** for inaccurate guides, bugs, or feature ideas.

## Adding a deletion guide (easiest first PR)

Guides live in [`guides/`](./guides) as YAML, one file per service. Copy an existing one
(e.g. `guides/github.yaml`) and edit. The shape:

```yaml
service:
  name: Example
  domain: example.com
  website: https://example.com
deletion:
  difficulty: easy            # easy | medium | hard | impossible
  estimated_time_minutes: 5
  requires_email_access: true
  requires_password: true
steps:
  - title: "Sign in"
    description: "Go to example.com and log in."
    url: "https://example.com/login"
deletion_request:
  method: email               # email | user_form | manual_only
  email:
    recipients: ["privacy@example.com"]
    compliance_laws: ["GDPR", "CCPA"]
    expected_response_time_days: 30
metadata:
  verified_by: "@your-handle"
  verified_date: "2026-06-30"
  notes: "Anything a user should know."
```

Validate locally before opening a PR:

```bash
bun run db:seed:guides   # validates every guide and loads it
```

### Guide guidelines

- **Accuracy over completeness.** A correct 3-step guide beats a guessed 8-step one.
- Use `method: manual_only` if you can't confirm a privacy email or a stable web form.
- Never include credentials, tracking links, or affiliate links.
- Mark `difficulty: impossible` honestly when a service offers no real deletion path.

## Development

```bash
bun install
cp .env.example .env
bun run db:migrate && bun run db:seed:guides
bun run test
bun run typecheck
```

## Pull requests

- Keep PRs focused. One guide or one fix per PR where possible.
- Conventional commit titles (`feat:`, `fix:`, `docs:`, `chore:`).
- CI must pass (typecheck + tests).

## Non-negotiable safety rules

PRs that do any of the following will be declined:

- Probing/enumerating third-party services to detect accounts.
- Sending deletion requests without email-ownership verification.
- Automating form submission that impersonates a user against a site's controls.
- Storing or transmitting user passwords / 2FA codes.

These boundaries are what keep forget-me legitimate. Thanks for respecting them.
