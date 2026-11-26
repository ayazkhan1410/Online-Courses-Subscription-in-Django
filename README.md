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
├── backend/
│   ├── ocs_backend_venv/        # Local Python virtualenv (gitignored)
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
│   ├── requirements.freeze.txt  # Exact pip freeze from ocs_backend_venv
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

Virtualenv name: **`ocs_backend_venv`** (Online Courses Subscription backend).

```bash
cd backend
python3 -m venv ocs_backend_venv
source ocs_backend_venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

# Start Postgres only, then migrate
cd .. && docker compose up -d db && cd backend
# backend/.env should use POSTGRES_HOST=localhost and POSTGRES_PORT=5433
python manage.py migrate
python manage.py seed_youtube_courses
python manage.py runserver 0.0.0.0:4781
```

Refresh the exact lock file from the active venv when deps change:

```bash
source ocs_backend_venv/bin/activate
pip freeze > requirements.freeze.txt
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

## Linting (Ruff)

```bash
cd backend
source ocs_backend_venv/bin/activate
ruff check .
ruff format .
```

CI runs the same checks on every PR (`.github/workflows/ruff.yml`). Relative imports are banned.

## Environment variables

See `backend/.env.example`. Important keys:

- `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`
- `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`

Never commit `backend/.env` or `ocs_backend_venv/`.

## Team roles

- **Frontend (Cursor):** UI, components, API integration
- **Backend (Ayaz):** DRF apps, Postgres, auth, business logic, security

## Notes

- Backend entrypoint migrates and seeds YouTube courses automatically.
- Media files are bind-mounted from `backend/media`.
- SQLite is not used; PostgreSQL is required.
- Theme preference is stored in the browser (`localStorage` key `swa_theme`).
