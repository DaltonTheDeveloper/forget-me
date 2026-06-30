# Security Policy

## Reporting a vulnerability

Please report security issues privately. **Do not open a public issue for vulnerabilities.**

- Email: security@forget-me.dev
- Or use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability).

We aim to acknowledge within 72 hours and to ship a fix or mitigation as quickly as the
severity warrants.

## Scope of special concern

Because forget-me sends deletion requests on people's behalf, we treat the following as
**critical**:

- Any way to send a deletion request for an email **without verifying ownership**.
- Any bypass of the email-verification token (forgery, replay, fixation).
- Leakage of searched emails beyond the documented 30-day findings retention.
- Storage or transmission of credentials/2FA (we never request these — report if you find any).

## Our security invariants

- No passwords or 2FA codes are ever requested, stored, or transmitted.
- No authenticated sessions are opened against third-party services.
- All deletion sending is gated on email-ownership verification.
- Secrets are read from environment only; `.env` is never committed.
