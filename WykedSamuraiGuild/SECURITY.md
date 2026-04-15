# Wyked Samurai Guild Security Baseline (First Pass)

Last updated: 2026-04-15

## Protections currently in place

- **Route and auth protections**
  - Protected backend endpoints require authenticated sessions via `requireAuth` or `requireSessionAuth`.
  - Policy acceptance guard is enforced on protected APIs.
  - Recent re-authentication checks are required for sensitive profile updates.
- **Frontend session handling**
  - Auth token is stored in `sessionStorage` (not long-term local storage) and is cleared on logout.
  - Legacy token key cleanup is run during logout.
- **Security headers**
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy
  - Permissions-Policy
- **CORS hardening**
  - Allowed origins are constrained via `WSG_FRONTEND_ORIGIN`.
  - Production no longer allows wildcard-style dynamic Render origins.
- **Payload safety and sanitization**
  - Structured request body checks (`requireObjectBody`).
  - Field-level string sanitization and max-length limits (`sanitizeBody`).
  - Content-safety gates for profile/chat/scenario/AI/recruiter-like payloads.
- **Abuse detection hooks**
  - Basic flood detection middleware for high-frequency activity.
  - Basic unsafe-content and scam/fraud keyword checks.
- **Rate limiting**
  - Login attempts
  - Signup attempts
  - Policy acceptance submissions
  - Chat/message sends
  - Scenario creation/completion actions
  - AI prompt submissions
- **Error handling**
  - Centralized safe error responder for server-level unhandled errors.
  - 5xx responses return generic user-safe messages.

## Remaining gaps / next steps

- Replace in-memory rate-limit and abuse trackers with a distributed store (Redis) for multi-instance deployments.
- Expand moderation classifiers beyond keyword matching (context-aware model + human review queues).
- Add CSRF protections if cookie-based auth is introduced.
- Add request signing / anti-automation protections for auth endpoints (captcha or bot score).
- Add structured security audit logging and anomaly alerting.
- Add formal data retention schedules and deletion workflows.
- Add secure secrets management and rotation policy documentation.
- Add comprehensive security test coverage (unit + integration + DAST baseline).

## Future work (not implemented in this pass)

- Optional identity verification workflows for high-trust accounts (e.g., providers like **ID.me** or **VerifyMe**) with explicit user consent, clear purpose limitation, and regional compliance controls.
