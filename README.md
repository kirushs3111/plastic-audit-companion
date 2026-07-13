# Plastic Audit Companion

Learn • Identify • Audit • Recycle

A citizen science platform for auditing household plastic waste: a
child-friendly Learn hub for the 7 resin codes, a room-by-room household
audit flow, and an admin dashboard for reviewing photos of plastics nobody
recognized.

## Project layout

```
frontend/    Next.js 16 (App Router) + TypeScript + Tailwind
backend/     FastAPI + PostgreSQL + Alembic
```

Each has its own README with setup details specific to it.

## Running locally (without Docker)

You need Postgres running locally first (`createdb pac_dev`).

```bash
# Terminal 1 - backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit DATABASE_URL if needed
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Terminal 2 - frontend
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Visit `http://localhost:3000`. API docs live at `http://localhost:8000/docs`.

## Running with Docker Compose

```bash
docker compose up --build
```

This starts Postgres, runs backend migrations automatically, and serves the
frontend at `http://localhost:3000` (API at `http://localhost:8000`).

**Note:** the Docker setup was written and each container's underlying
commands were verified to work directly (`alembic upgrade head && uvicorn
...` for the backend, the Next.js standalone server for the frontend), but
`docker compose up` itself has not been run end-to-end in this environment
since Docker isn't available here. Test it before relying on it for a real
deployment.

## Deploying for real

- **Frontend → Vercel**: point it at `frontend/`, set `NEXT_PUBLIC_API_BASE_URL`
  to your deployed backend's URL as a build-time env var (it's inlined into
  the client bundle, so it must be set before build, not just at runtime).
- **Backend → Railway/Render**: point it at `backend/`, using the provided
  `Dockerfile` or their native Python buildpack. Set `DATABASE_URL` to a
  managed Postgres instance, generate a real `SECRET_KEY`
  (`python -c "import secrets; print(secrets.token_urlsafe(48))"`), and set
  `FRONTEND_ORIGINS` to your Vercel URL for CORS.
- **Uploaded photos**: currently written to local disk (`backend/uploads/`).
  On Railway/Render this needs a persistent volume, or swap
  `app/routers/photos.py` for Cloudinary/Firebase before deploying - local
  disk storage will not survive a redeploy on most PaaS platforms.

## Testing

```bash
# Backend - 31 tests covering auth, ownership isolation, entry validation,
# the review queue, and admin analytics
cd backend
createdb pac_test
TEST_DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/pac_test \
  pytest tests/ -v

# Frontend - type-check and lint (no test suite yet)
cd frontend
npx tsc --noEmit
npx eslint src
```

## What's real vs. still a placeholder

**Fully working and tested:** landing pages, guest/registered auth,
the full household audit flow (frontend talks to the real backend - no
localStorage), session resume, the Learn encyclopedia with quizzes, the
user dashboard, the admin Photo Review queue, admin analytics with a
CSV export, and the gamification features - Plastic Detective badges,
Plastic Hunt challenges, the House Plastic Passport, and the Plastic
Journey infographic - all computed from real audit data.

**Deliberately not built:** PDF report generation (only CSV). There's no
email verification or password-reset flow, and admin promotion is
manual SQL (no first-admin bootstrap UI). Rate limiting on auth endpoints
is real (see below), but it's in-memory and per-process - fine for a
single backend instance, not safe if you scale to multiple replicas
without switching to a shared Redis-backed limiter.

## Security fixes applied during a pre-deployment review

- **CSV/Formula Injection (CWE-1236)**: `household_name`, `address`, and
  `city` are free text a user fully controls. Before this fix, a value
  like `=cmd|'/c calc'!A1` went straight into the CSV export and could
  execute as a formula the moment an admin opened it in Excel/Google
  Sheets. Now any field starting with `=`, `+`, `-`, or `@` gets a
  neutralizing quote prefix.
- **Stored XSS via file upload**: the photo upload endpoint used to
  derive the saved file's extension from the client-supplied filename.
  An attacker could upload a file named `evil.html` containing a
  `<script>` tag while declaring `Content-Type: image/jpeg` - it passed
  the check, saved as `{uuid}.html`, and a browser visiting that URL
  directly would render it as HTML. Fixed two ways: the extension now
  comes only from a fixed content-type mapping (never the filename), and
  the actual file bytes are checked against real image magic numbers -
  the declared Content-Type header is exactly as attacker-controlled as
  the filename was, so it's verified rather than trusted.
- **Forgeable auth tokens from a default secret**: the app now refuses to
  start if `ENVIRONMENT` isn't `development` and `SECRET_KEY` is still
  the placeholder value baked into the repo - deploying without setting a
  real secret used to fail silently instead of loudly.
- **No rate limiting on auth endpoints**: added per-IP limits (10/min on
  `/auth/guest`, 5/min on `/auth/register`, 10/min on `/auth/login`) to
  slow down naive brute-force and mass account creation.
- **Uploaded photos were publicly viewable by anyone with the URL**: the
  original implementation served `backend/uploads/` as a static file
  directory with no authentication at all - the only thing standing
  between a stranger and any household's photo was an unguessable
  filename (security through obscurity, not real access control). Photos
  are now served through `GET /api/photos/{id}/file`, which requires a
  valid token and checks the requester owns that photo (or is an admin)
  before returning any bytes - a bare `/uploads/...` URL no longer
  resolves to anything at all.
