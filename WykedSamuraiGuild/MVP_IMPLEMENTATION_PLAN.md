# Wyked Samurai Guild MVP PoC — Repo Audit & Implementation Plan

## 1) Concise repo audit

### Current stack
- **Frontend:** Static HTML/CSS/vanilla JS SPA shell (`web/index.html`, `web/styles.css`, `web/app.js`).
- **Backend:** Node.js + Express (ESM), CORS, dotenv (`server/server.js`, `server/package.json`).
- **AI integration:** Hugging Face Inference API in `server/services/aiService.js`.
- **Data layer:** In-memory Maps only (no database) in `server/models/scenarioStore.js`.
- **Deployment:** Render split services (one Node web service + one static service) in `render.yaml`.

### Routing and components
- Frontend uses hash routing (`#/...`) with route-to-page-key mapping in `web/app.js`.
- UI is function-based string-template rendering (no framework component model).
- Backend routes:
  - `GET /api/health`
  - `POST /api/scenarios/generate`
  - `GET /api/scenarios`
  - `GET /api/scenarios/:id`

### Styling approach
- Single global stylesheet with CSS variables and responsive layout.
- Two visual themes toggled via body class (`professional` vs `roleplay`).

### Reusable assets for MVP
- Existing nav/shell and route scaffolding can be extended for `Trial Arena` and `Members` pages.
- Existing backend layering (`routes -> controllers -> services -> models`) is a good template for auth, profile, and trial modules.
- Existing AI service patterns (prompt builder, strict parse/validate, error handling) can be reused for trial chat response generation.
- Existing scenario persistence and list/detail patterns can be adapted to trial catalog + trial runs.

## 2) Missing MVP pieces

1. **Authentication system**
   - No user model, no signup/login/session/JWT, no protected routes.
2. **Persistent storage**
   - Current in-memory store loses data on restart; MVP needs persistent users/profiles/trial results.
3. **Profile domain**
   - No profile CRUD/read endpoints tied to auth identity.
4. **Trial domain**
   - No trial model, no seeded starter trials, no run/result model.
5. **Real-time AI chat flow**
   - Current AI endpoint is one-shot scenario generation; no streaming/chat-turn lifecycle.
6. **Members listing page data**
   - UI placeholder exists, but no API-backed member directory.
7. **Runtime alignment risk**
   - Frontend currently fetches relative `/api` while deployment splits static/server services.

## 3) Recommended PoC implementation strategy (smallest clean order)

### Phase 0 — Stabilize runtime contract (do first)
**Goal:** Ensure UI can reliably call API in local + Render.

- Add frontend API base config (env/global fallback).
- Option A (preferred for PoC): Serve `web/` from Express to keep same-origin `/api`.
- Option B: Keep split services and set explicit API base URL in frontend config.

**Why first:** Prevents false negatives while building auth/chat features.

### Phase 1 — Add persistence + core models
**Goal:** Introduce minimal DB-backed schema for auth + trials + results.

- Add SQLite (or Postgres if preferred for Render) with migration scripts.
- Create models/tables:
  - `users`
  - `profiles`
  - `trials`
  - `trial_runs`
  - `trial_messages` (for chat transcript)
- Seed exactly 5 starter trials.

**PoC note:** For speed, SQLite is acceptable locally; if Render persistence is required, switch to managed Postgres early.

### Phase 2 — Authentication and identity
**Goal:** Users can register/login and access protected endpoints.

- Implement register/login/logout + password hashing.
- JWT cookie or bearer token auth middleware.
- Add `/api/me` endpoint.

### Phase 3 — Profiles + members directory
**Goal:** Basic profile experience and member discovery.

- CRUD-lite profile endpoints (read/update own profile).
- Members list endpoint (public within app auth scope).
- Members detail endpoint.

### Phase 4 — Trial Arena + starter trials UI/API
**Goal:** Dedicated Arena page with trial catalog + run launch.

- API endpoints for trial catalog and trial run lifecycle.
- Frontend route/page for Trial Arena.
- Show 5 seeded starter trials and “Start Trial” actions.

### Phase 5 — Real-time AI trial chat flow
**Goal:** Chat turns during a trial run, near real-time UX.

- Add streaming endpoint (SSE first for simplicity) for AI responses.
- Persist user + AI messages per run.
- Add deterministic fallback/mock model response if AI unavailable.

### Phase 6 — Save results into profile
**Goal:** Completed trial outcomes visible on profile.

- On run completion, compute/store summary + score/result flags.
- Expose profile results endpoint.
- Render recent trial outcomes in profile UI.

## 4) Likely conflicts, blockers, risky assumptions

1. **Deployment split mismatch:** Static frontend + separate API service may break relative `fetch('/api/*')` without rewrite/base URL handling.
2. **No current test harness:** No test scripts or CI means regression risk during refactor.
3. **AI reliability risk:** Hugging Face model availability/latency/format drift can break strict JSON expectations.
4. **Stateful chat requirement vs current stateless service:** Need explicit run/message persistence to avoid losing context.
5. **Auth UX in vanilla JS:** Without framework/router state management, auth guards and token handling can get brittle quickly.
6. **In-memory legacy stores:** Existing scenario store patterns are helpful but must not be relied upon for persistent MVP features.

## 5) Exact file/route/model/component plan by phase

### Phase 0 (runtime contract)
**Change**
- `server/server.js` (optional static hosting + API CORS tightening)
- `web/app.js` (central API base helper)
- `README.md` (single run/deploy contract)
- `render.yaml` (if changing to unified service)

### Phase 1 (data layer + seeds)
**Create**
- `server/db/client.js`
- `server/db/migrate.js`
- `server/db/seed.js`
- `server/db/migrations/001_init.sql`
- `server/db/migrations/002_seed_trials.sql`
- `server/models/userModel.js`
- `server/models/profileModel.js`
- `server/models/trialModel.js`
- `server/models/trialRunModel.js`

**Routes unaffected yet:** existing scenario routes can remain for backward compatibility.

### Phase 2 (auth)
**Create**
- `server/routes/authRoutes.js`
- `server/controllers/authController.js`
- `server/services/authService.js`
- `server/middleware/authMiddleware.js`

**Change**
- `server/routes/apiRoutes.js` (mount `/auth` + `/me`)
- `server/package.json` (add auth deps + scripts)

**New routes**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`

### Phase 3 (profiles + members)
**Create**
- `server/routes/profileRoutes.js`
- `server/controllers/profileController.js`
- `server/services/profileService.js`

**Change**
- `server/routes/apiRoutes.js` (mount profiles/members)

**New routes**
- `GET /api/profile/me`
- `PATCH /api/profile/me`
- `GET /api/members`
- `GET /api/members/:id`

### Phase 4 (Trial Arena + starter trials)
**Create**
- `server/routes/trialRoutes.js`
- `server/controllers/trialController.js`
- `server/services/trialService.js`

**Change**
- `server/routes/apiRoutes.js` (mount `/trials`)
- `web/app.js` (new Arena data-driven view + route guards)

**New routes**
- `GET /api/trials`
- `GET /api/trials/:id`
- `POST /api/trials/:id/runs`
- `GET /api/runs/:runId`

### Phase 5 (real-time AI trial chat)
**Create**
- `server/routes/trialChatRoutes.js`
- `server/controllers/trialChatController.js`
- `server/services/trialChatService.js`

**Change**
- `server/services/aiService.js` (add trial-chat response mode)
- `web/app.js` (chat panel + SSE handling)

**New routes**
- `POST /api/runs/:runId/messages` (persist user turn)
- `GET /api/runs/:runId/stream` (SSE AI response stream)
- `POST /api/runs/:runId/complete`

### Phase 6 (results on profiles)
**Create/Change**
- `server/services/resultService.js` (or fold into trial service)
- `server/controllers/profileController.js` (append results view data)
- `web/app.js` (profile trial results section)

**New routes**
- `GET /api/profile/me/results`

## 6) Mock vs fully implement (PoC guidance)

### Fully implement in PoC
- Auth register/login with hashed passwords + auth middleware.
- Persistent storage for users/profiles/trials/runs/messages/results.
- Trial catalog endpoint seeded with 5 starter trials.
- Trial run creation and message persistence.
- Members listing (basic fields only).

### Mock/relax in PoC
- **AI robustness:** include mocked fallback reply path and fixed timeout handling.
- **Advanced profile fields:** keep to display name, bio, avatar URL, rank/title.
- **Scoring sophistication:** simple deterministic score rubric initially.
- **Authorization granularity:** basic self vs others access checks only.
- **Presence/online status:** mock or omit.

## 7) Definition of done for MVP PoC
- A user can register/login, edit their profile, start one of 5 trials, chat with AI in a run, complete the run, and see saved results on their profile.
- Authenticated users can browse a members page with other profiles.
- App works end-to-end in the documented local and deployment topology.

## 8) Identity architecture addendum (Account / Profile / Characters)

A dedicated blueprint now defines the target identity model and UX boundaries:

- `PROFILE_ACCOUNTS_CHARACTERS_BLUEPRINT.md`

Use that document as the source of truth for:
- account/profile/character separation
- profile section taxonomy + inline editing expectations
- character MVP requirements (create/edit/list/archive)
- navigation boundaries between main site menu and account menu

When implementation sequencing conflicts arise, prioritize the blueprint's recommended order:
1) account reliability, 2) profile foundation, 3) characters, 4) resume/professional, 5) connections/activity.
