# Plastic Audit Companion — Backend

FastAPI + PostgreSQL API for the audit flow, guest/registered auth, the
admin dashboard, and gamification (badges, hunts, the House Plastic
Passport). Unidentified plastics are resolved by a human admin reviewing
photos, not an AI model - see "Identifying unknown plastics" below.

## Stack

- **FastAPI** for the HTTP API
- **SQLAlchemy 2.0** (declarative, typed `Mapped[...]` columns) as the ORM
- **PostgreSQL** — every model uses Postgres-specific types (`UUID`, `JSONB`,
  native `ENUM`), so SQLite is not a supported fallback here
- **Alembic** for migrations (schema is managed via migrations, not
  `create_all`, once you're past initial local setup)
- **passlib[bcrypt]** for password hashing, **python-jose** for JWTs

## Local setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env              # then edit .env if your Postgres differs

# Create the database (adjust to how you run Postgres locally)
createdb pac_dev

# Apply migrations
alembic upgrade head

# Run the dev server
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for interactive Swagger docs, or
`http://localhost:8000/health` for a plain liveness check.

## Project layout

```
app/
  core/         # settings, DB session, JWT/password helpers, auth dependency
  models/       # SQLAlchemy tables: User, Household, AuditSession,
                # PlasticEntry, Photo, Prediction, LearningProgress, Report
  schemas/      # Pydantic request/response models
  routers/      # auth, households, audit-sessions, predictions
  services/     # business logic kept out of routers (currently: the
                # placeholder prediction heuristic)
  main.py       # app instance, CORS, router registration
alembic/        # migrations - env.py reads DATABASE_URL from app settings
```

## Auth model (Module 2)

Two ways to get a bearer token:

- `POST /api/auth/guest` — no body, creates a throwaway guest `User` and
  returns a token immediately. This is what lets someone start an audit
  with zero signup friction.
- `POST /api/auth/register` then `POST /api/auth/login` — real accounts
  with hashed passwords.

Every other endpoint (except `/health`) requires
`Authorization: Bearer <token>`. Ownership is enforced at the query level:
a household or audit session that doesn't belong to the caller returns
`404`, not `403` — this avoids leaking whether a given ID exists at all.

## What's still a placeholder

- **Photo storage** uses local disk (`app/routers/photos.py`). Files are
  written to `backend/uploads/` but never served as static files -
  viewing one always goes through `GET /api/photos/{id}/file`, which
  checks the requester owns it (or is an admin) first. Swap the save
  step for Cloudinary/Firebase later without changing the
  `POST /api/photos/upload -> {storage_url}` contract. Needs a persistent
  volume in production or uploads won't survive a redeploy.
- **PDF reports** aren't implemented - only CSV export
  (`GET /api/admin/export.csv`). The `Report` table exists to support PDF
  generation later without a schema change.

## Gamification (badges, hunts, passport)

All computed live from real submitted-audit data - no separate tables to
keep in sync, no fake progress:

- `GET /api/badges` - "Plastic Detective" achievements (first audit,
  100 items, all 7 rooms, all 7 types identified, 5 photos submitted for
  review, audits across 3 different months).
- `GET /api/hunts` - "Find 5 PET bottles" style challenges, one per resin
  type, progress capped at a target of 5.
- `GET /api/households/{id}/passport` - the House Plastic Passport:
  submitted-audit totals for one household, grouped by month and broken
  down by plastic type, so you can see change over time.

All three only count *submitted* audit sessions, matching how the admin
analytics endpoint counts entries - an in-progress, unsubmitted audit
doesn't move the needle until it's actually submitted.

## Admin dashboard (Module 6)

Two admin-only endpoint groups, both requiring `is_admin: true` on the
calling user (403 otherwise):

- `GET /api/admin/overview` — aggregate counts (users, households, audits,
  items) plus a breakdown by plastic type and by room, sorted by quantity.
  Powers the frontend's analytics charts.
- `GET /api/admin/export.csv` — one row per plastic entry, joined to
  household name/city, streamed as a CSV download.
- `GET /api/admin/export-photos.zip` — every uploaded photo, one folder
  per household, streamed as a ZIP. Household names are sanitized before
  becoming a folder name (Zip Slip / CWE-22 protection - see the code
  comment in `app/routers/admin.py`), and files missing from disk are
  skipped rather than failing the whole export.
- `GET /api/review-queue` / `POST /api/review-queue/{id}/assign` — see
  "Identifying unknown plastics" below.

There's no built-in way to make the *first* admin - promote one manually:
```sql
UPDATE users SET is_admin = true WHERE email = 'you@example.com';
```

## Identifying unknown plastics (no AI)

There is no AI prediction step. If someone doesn't know the plastic type:

1. They upload photos (front required, back/bottom optional) instead of
   answering a questionnaire or getting a guess.
2. The entry is saved with `identification_method: "pending-review"`,
   `plastic_code: null`, `needs_review: true`.
3. An admin reviews it later via:
   - `GET /api/review-queue` — every entry still awaiting a type
   - `POST /api/review-queue/{entry_id}/assign` — assigns the real code,
     clears `needs_review`

This is what the spec calls "Photo Review" under Module 6 — a human
reviewing photos, not a model guessing.

## Running the test suite

31 tests covering auth, cross-user ownership isolation, entry validation
(the known/pending-review CHECK constraint), the review queue, and admin
analytics/CSV export. Uses a dedicated test database, fully reset between
every test for isolation:

```bash
createdb pac_test
TEST_DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/pac_test \
  pytest tests/ -v
```

## Running migrations after changing a model

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

Always read the generated migration before applying it — Alembic's
autogenerate does **not** emit `DROP TYPE` for Postgres ENUMs on downgrade
by default; the initial migration in this repo shows the manual fix if you
add more enum columns later.
