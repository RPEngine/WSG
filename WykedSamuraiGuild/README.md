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

### Environment variables

Backend (`/server`):
- `PORT` (Render supplies this automatically).
- `WSG_HF_API_TOKEN` (required for Hugging Face calls).
- `HUGGING_FACE_MODEL` (optional override; defaults to `mistralai/Mistral-7B-Instruct-v0.3`).
- `WSG_FRONTEND_ORIGIN` (optional explicit frontend origin(s) for CORS allowlist; supports comma-separated values).

Frontend (`/web`):
- `window.WSG_API_BASE_URL` (optional runtime global override).
- `<meta name="wsg-api-base-url" content="https://wsg-7hmk.onrender.com">` (current static override in `web/index.html`).
