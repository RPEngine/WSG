# Wyked Samurai Guild

Project structure for the Wyked Samurai Guild application.

## Backend
Located in `/server`

Uses Node.js + Express.

## Frontend
Located in `/web`

Static HTML/CSS/JS interface.

## Deployment
Configured for Render using `render.yaml`.

### Render backend service settings

If configuring manually in Render, create a **Web Service** (not Static Site) with:
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`

The backend health route is:
- `GET /api/ai/test` (also accepts `POST`)
- `POST /api/ai/chat` (AI-compatible alias to scenario generation)
- `POST /api/ai/scenario` (AI-compatible alias to scenario generation)

### Environment variables

Backend (`/server`):
- `PORT` (Render supplies this automatically).
- `HUGGINGFACE_API_TOKEN` (primary Hugging Face token variable).
- `HUGGING_FACE_API_TOKEN` (legacy-compatible Hugging Face token variable).
- `WSG_HF_API_TOKEN` (legacy-compatible Hugging Face token variable).
- `HF_TOKEN` (also accepted).
- `HUGGING_FACE_MODEL` (optional override; defaults to `HuggingFaceH4/zephyr-7b-beta`).
- `HUGGING_FACE_HEALTH_MODEL` (optional provider-test model override; defaults to the active model).
- `WSG_FRONTEND_ORIGIN` (optional explicit frontend origin(s) for CORS allowlist; supports comma-separated values).

Frontend (`/web`):
- `window.WSG_BACKEND_BASE_URL` (preferred runtime global override for backend API host).
- `localStorage['wsg-backend-base-url']` (preferred browser override for backend API host).
- `<meta name="wsg-backend-base-url" content="">` (preferred static override in `web/index.html`).
- `window.WSG_API_BASE_URL` (optional runtime global override).
  - Leave unset to use same-origin API calls.
- `<meta name="wsg-api-base-url" content="">` (optional static override in `web/index.html`).
