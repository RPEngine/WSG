# Repository: WykedSamurai/WSG

# WSG Security Baseline (Security Hardening Pass)

Last updated: 2026-04-15

## Current protections

- **Route guards + policy gating**
  - Protected frontend routes are guarded by stable helpers: `isAuthenticated()`, `hasAcceptedCurrentPolicies(user)`, and `requiresPolicyAcceptance(user)`.
  - Authenticated users missing current policy acceptance are redirected to `/policy/accept`.
  - Protected backend APIs enforce session auth and policy acceptance checks.
- **Session cleanup**
  - Logout clears auth token/session state and removes user-scoped onboarding/scenario cache keys from client storage.
  - Session continuity data is scoped and minimized to required state only.
- **Security headers**
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy`
  - `Permissions-Policy`
- **Validation + sanitization**
  - Backend requires object JSON payloads and enforces strict field schemas for active auth/profile/chat/scenario/AI inputs.
  - Text inputs are sanitized server-side (HTML/script patterns removed, control chars trimmed, max lengths enforced).
  - Invalid/empty submissions are rejected with safe 4xx responses.
- **Rate limiting + throttling**
  - Sensitive actions are rate limited: login, signup, policy acceptance, chat sends, scenario generation/completion, AI request paths.
  - Additional flood/spam throttling is applied through moderation hooks.
- **CORS restrictions**
  - CORS allowlist is origin-based and environment-aware (`WSG_FRONTEND_ORIGIN` / `WSG_FRONTEND_ORIGINS`).
  - No permissive wildcard production behavior.
- **Production-safe error handling**
  - Server unhandled errors return safe generic messages for 5xx responses.
  - Frontend presents user-safe generic messages for network/parse failures.
  - Detailed error diagnostics stay in server logs.
- **Moderation/security middleware hooks**
  - Pluggable moderation hooks are wired in request/message processing for:
    - message validation hook
    - spam/flood detection hook
    - unsafe content detection hook
    - scam/fraud keyword detection hook

## Future planned protections (not implemented in this pass)

- Identity verification provider integration (documented only; not implemented now).
- Recruiter verification workflow with trust tiers.
- Stronger moderation pipeline (contextual classifiers + human review queue).
- Security audit logging and tamper-aware monitoring.
- Additional abuse detection signals and anomaly detection.
- Distributed/global rate limiting storage for multi-instance deployments.
