# Code Review Notes and Recommended Next Step

## What looks good
- Backend routing is cleanly separated (`routes` -> `controllers` -> `services` -> `models`).
- Scenario generation has defensive JSON parsing and schema validation.
- Duplicate scenario detection is implemented with a normalized SHA-256 hash.

## Key gap to address first
The highest-priority next step is to make the **web app and API run together predictably in local/dev and production**.

Right now:
- Frontend calls `fetch('/api/health')`.
- Backend serves API routes under `/api`.
- But the frontend and backend are in separate folders with no unified dev script, no proxy config, and no clear deployment contract in docs.

This often causes API calls to fail when the web files are hosted separately from the server process.

## Recommended immediate implementation
1. Add a single documented run path (for example: Express serves `/web` as static files and `/api/*` as API).
2. Add npm scripts for local development (`dev`, `start`) and document exact commands.
3. Add a small environment-based API base URL in the frontend (`window.WSG_API_BASE_URL` fallback), so the frontend works both co-hosted and split-hosted.
4. Update README with one canonical workflow.

## Why this should be first
Without deployment/runtime alignment, even a healthy backend appears broken from the UI. Fixing this first unlocks meaningful testing of scenario generation and future features.
