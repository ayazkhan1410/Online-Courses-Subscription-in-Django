# Online Courses Subscription

Full-stack online courses platform with a **Django REST Framework** API, **PostgreSQL** database, and a separate static **frontend**, all runnable via Docker Compose.

| Service  | Technology                    | Port  |
|----------|-------------------------------|-------|
| Frontend | nginx + HTML/CSS/JS           | 4780  |
| Backend  | Django 5 + DRF + Gunicorn     | 4781  |
| Database | PostgreSQL 16                 | 5433→5432 |

## Project structure

```
.
├── venv/                        # Local Python virtualenv (gitignored)
├── backend/
│   ├── config/                  # Django project settings & root URLs
│   ├── accounts/                # Users, profiles, auth APIs
│   ├── courses/                 # Course catalog, modules, YouTube seed
│   ├── learning/                # Enrollments, progress, wishlist, dashboard
│   ├── subscriptions/           # Plans, Stripe become-pro, public config
│   ├── contact/                 # Contact form messages
│   ├── utils/                   # Shared helpers (e.g. utils/email.py)
│   ├── media/                   # Uploaded course images
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── requirements.txt         # Runtime dependencies
│   ├── requirements-dev.txt     # + Ruff
│   ├── requirements.freeze.txt  # Exact pip freeze from venv
│   ├── .env.example
│   └── manage.py
├── frontend/                    # Static UI (nginx) on port 4780
├── docker-compose.yml           # frontend + backend + postgres
├── pyproject.toml               # Ruff (bans relative imports)
└── README.md
```

### Domain apps

| App             | Models                         | Responsibility                          |
|-----------------|--------------------------------|-----------------------------------------|
| `accounts`      | `CustomUser`, `Profile`        | Auth, password reset, `/auth/*`         |
| `courses`       | `Courses`, `CourseModule`      | Catalog listing & detail                |
| `learning`      | `Enrollment`, `LessonProgress`, `WishlistItem` | Dashboard, enroll, progress |
| `subscriptions` | `SubscriptionList`, `Subscription` | Memberships, Stripe, `/config/`     |
| `contact`       | `Contact`                      | Contact form submissions                |

## Features

- Real YouTube playlist catalog (Study with Ayaz) via idempotent seed
- Student dashboard after register/login (enrolled, progress, wishlist)
- Course enroll, lesson progress, wishlist APIs
- Light / dark theme with persisted preference
- Course listing, search, and pagination
- Course details with YouTube lesson player
- Register / login / logout (DRF TokenAuthentication)
- Contact form, forget / change password
- Stripe “Become Pro” subscription flow

## Quick start (Docker)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

| Service  | URL                               |
|----------|-----------------------------------|
| Frontend | http://localhost:4780             |
| Backend  | http://localhost:4781/api/        |
| Admin    | http://localhost:4781/admin/      |
| Postgres | localhost:5433 (container `5432`) |

```bash
docker compose exec backend python manage.py createsuperuser
docker compose down          # stop
docker compose down -v       # stop + wipe Postgres volume
```

Compose sets `POSTGRES_HOST=db` for the backend container. Host clients use `localhost:5433`.

## Local backend (virtualenv)

Virtualenv name: **`venv`** at the repo root.
Cursor / VS Code should use `venv/bin/python` (see `.vscode/settings.json`
and `backend/pyrightconfig.json`) so Django imports resolve in the editor.

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt -r backend/requirements-dev.txt

# Start Postgres only, then migrate
docker compose up -d db
cd backend
# backend/.env should use POSTGRES_HOST=localhost and POSTGRES_PORT=5433
python manage.py migrate
python manage.py seed_youtube_courses
python manage.py runserver 0.0.0.0:4781
```

Refresh the exact lock file from the active venv when deps change:

```bash
source venv/bin/activate
pip freeze > backend/requirements.freeze.txt
```

### Frontend (local)

```bash
cd frontend/public
python -m http.server 4780
```

## API contract

Base URL: `http://localhost:4781/api`

| Method | Endpoint                  | Auth | App            |
|--------|---------------------------|------|----------------|
| GET    | `/courses/`               | No   | `courses`      |
| GET    | `/courses/<slug>/`        | No   | `courses`      |
| POST   | `/courses/<slug>/enroll/` | Yes  | `learning`     |
| GET    | `/dashboard/`             | Yes  | `learning`     |
| GET    | `/enrollments/`           | Yes  | `learning`     |
| POST   | `/modules/<id>/progress/` | Yes  | `learning`     |
| GET/POST | `/wishlist/`            | Yes  | `learning`     |
| DELETE | `/wishlist/<slug>/`       | Yes  | `learning`     |
| POST   | `/contact/`               | No   | `contact`      |
| POST   | `/playlist-suggestions/`  | No   | `courses`      |
| POST   | `/auth/register/`         | No   | `accounts`     |
| POST   | `/auth/login/`            | No   | `accounts`     |
| POST   | `/auth/logout/`           | Yes  | `accounts`     |
| GET    | `/auth/me/`               | Yes  | `accounts`     |
| POST   | `/auth/forget-password/`  | No   | `accounts`     |
| POST   | `/auth/change-password/`  | No   | `accounts`     |
| GET    | `/subscriptions/`         | Yes  | `subscriptions`|
| POST   | `/become-pro/`            | Yes  | `subscriptions`|
| GET    | `/config/`                | No   | `subscriptions`|

Auth header: `Authorization: Token <key>`

### Seed YouTube courses

Entrypoint runs this on every backend start (safe to re-run):

```bash
docker compose exec backend python manage.py seed_youtube_courses
```

Catalog source: `backend/courses/data/youtube_catalog.json` (from [@studywithayaz](https://www.youtube.com/@studywithayaz/playlists) playlists).

### Weekly lesson reminders

Opt-in emails for learners who have not finished a lesson in 3+ days (at most once
per 7 days). Schedule `send_weekly_reminders` in deployment; locally:

```bash
python manage.py send_weekly_reminders
```

Unsubscribe is one-click at `GET /api/email/unsubscribe/<token>/` (no login).

### Sync YouTube playlists

Re-fetch published course playlists and append new lessons (set `YOUTUBE_API_KEY` in `backend/.env`):

```bash
python manage.py sync_playlists
```

Safe to run on a schedule in production. Without an API key the command logs a warning and exits.

## Linting (Ruff)

```bash
source venv/bin/activate
ruff check backend
ruff format backend
```

CI runs the same checks on every PR (`.github/workflows/ruff.yml`). Relative imports are banned.

## Environment variables

See `backend/.env.example`. Important keys:

- `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`
- `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, `FRONTEND_INTERNAL_URL`,
  `API_PUBLIC_URL`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- `YOUTUBE_API_KEY` (optional; required for `sync_playlists`)
- `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`

Never commit `backend/.env` or `venv/`.

## Team roles

- **Frontend (Cursor):** UI, components, API integration
- **Backend (Ayaz):** DRF apps, Postgres, auth, business logic, security

## SEO and social previews (Docker)

The React app is still a client-side SPA, but **public catalog URLs** need real
HTML for crawlers:

1. **nginx** (frontend container) proxies `/`, `/courses/*`, `/paths/*`,
   `/categories/*`, `/done/*`, static marketing pages, `/robots.txt`, and
   `/sitemap.xml` to the Django backend on the Docker network.
2. Django **`seo`** app serves the built `index.html` shell (fetched from
   `FRONTEND_INTERNAL_URL`, usually `http://frontend:4780`) with injected
   `<title>`, description, canonical, Open Graph tags, and JSON-LD on course
   pages.
3. Logged-in areas (`/dashboard`, `/learn`) and JSON APIs stay on the normal
   nginx SPA fallback; `robots.txt` disallows those paths.
4. OG images: `/api/og/course/<slug>.png`, `/api/og/default.png`, and the
   completion cards at `/api/og/done/<share_id>.png`.

Set `FRONTEND_URL` to the public site origin and `API_PUBLIC_URL` to the
origin where browsers reach the API (defaults swap port `4780` → `4781` on
localhost). In Compose, `FRONTEND_INTERNAL_URL=http://frontend:4780` lets the
backend pull the current Vite build’s `index.html` for asset hashes.

## Notes

- Backend entrypoint migrates and seeds YouTube courses automatically.
- Media files are bind-mounted from `backend/media`.
- SQLite is not used; PostgreSQL is required.
- Theme preference is stored in the browser (`localStorage` key `swa_theme`).
