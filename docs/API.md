# forget-me API reference

Base URL (local): `http://localhost:3001`. All responses are JSON unless noted.
Every integration is env-gated; endpoints needing an unconfigured provider return `503`.

## Health & stats

### `GET /health`
Returns feature flags derived from configured env keys.
```json
{ "ok": true, "features": { "db": true, "hibp": false, "sending": false, "auth": false, "payments": false } }
```

### `GET /api/stats`
```json
{ "totalGuides": 40, "verifiedGuides": 40, "searchesCompleted": 0, "requestsSent": 0 }
```

## Discovery

### `POST /api/search`
Starts an async discovery job. **No third-party probing** — sources are HIBP (consented),
public GitHub search, and user self-selection.
```json
// request
{ "email": "you@example.com", "sources": ["hibp", "public_search"], "selectedServices": ["GitHub"] }
// response (202)
{ "jobId": "job_…", "status": "processing", "email": "you@example.com" }
```

### `GET /api/findings/:jobId`
Poll until `status` is `completed` or `failed`.
```json
{ "jobId": "job_…", "status": "completed", "findings": [
  { "id": "self_selection:GitHub", "service": "GitHub", "source": "self_selection",
    "confidence": 1, "guideAvailable": true, "guideId": 12 }
], "totalFound": 1, "log": ["Discovered 1 unique service(s)…"] }
```

## Guides

- `GET /api/guides?search=&difficulty=&limit=&offset=` → `{ total, guides: [...] }`
- `GET /api/guides/:id` — `id` may be a numeric id or a service name → guide object
- `POST /api/guides/contribute` — `{ service_name, github_username, change_summary?, action? }`

## Verification (the sending gate)

No deletion request is ever sent for an email until its owner verifies control of it.

### `POST /api/verify/start`
```json
// request
{ "email": "you@example.com" }
// response
{ "status": "verification_sent", "expiresAt": "…", "delivered": true,
  "devConfirmUrl": "http://localhost:3001/api/verify/confirm?token=…" }
```
`devConfirmUrl` is only returned when email sending is disabled (local dev), so the flow
is testable without Resend.

### `GET /api/verify/confirm?token=…`
Marks the email verified (HTML confirmation page).

## Deletion requests

### `POST /api/request/send`  *(gated)*
Returns `403 { "error": "email_not_verified" }` unless the email is verified.
```json
// request
{ "jobId": "job_…", "email": "you@example.com", "services": ["GitHub", "Spotify"],
  "jurisdiction": "EU", "skipManualOnly": true }
// response
{ "status": "processed", "requests": [
  { "requestId": "req_…", "service": "GitHub", "method": "email", "status": "sent" },
  { "requestId": "req_…", "service": "Spotify", "method": "user_form",
    "status": "requires_followup", "userFormUrl": "https://…" }
], "summary": { "sent": 1, "pending": 0, "requiresFollowup": 1, "failed": 0 } }
```

- `GET /api/request/status/:jobId` → `{ jobId, requests, summary }`
- `POST /api/request/retry/:requestId` — re-send an `email`-method request
- `POST /api/request/verify/:requestId` — `{ verified: true, notes? }` user-confirms deletion

## Auth & billing (env-gated)

- `POST /api/auth/webhook` — Clerk `user.created`/`updated` (svix-verified)
- `GET /api/auth/user` — profile (needs `x-clerk-user-id`)
- `POST /api/billing/session` — Stripe checkout `{ tier: "monthly"|"annual"|"lifetime" }`
- `GET /api/billing/subscription`, `POST /api/billing/cancel`
- `POST /api/billing/webhook` — Stripe events (signed)
