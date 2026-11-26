# Online Courses Subscription

Separated **Django REST Framework** backend and static **frontend**, fully Dockerized.

## Project structure

```
.
├── backend/                 # Django + DRF API (port 4781)
│   ├── config/              # Project settings & root URLs
│   ├── study/               # Domain app (models, serializers, views, APIs)
│   ├── media/               # Uploaded course images
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── requirements.txt
│   ├── .env.example
│   └── manage.py
├── frontend/                # Static UI served by nginx (port 4780)
│   ├── public/              # HTML / CSS / JS
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.example
├── docker-compose.yml
└── README.md
```

## Features preserved

- Course listing, search, pagination
- Course details with modules (auth required)
- Register / login / logout (token auth)
- Contact form
- Forget / change password
- Stripe “Become Pro” subscription flow
- About page

## Quick start (Docker)

1. Copy env files and fill secrets as needed:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Build and start:

```bash
docker compose up --build
```

3. Open:

| Service  | URL                         |
|----------|-----------------------------|
| Frontend | http://localhost:4780       |
| Backend  | http://localhost:4781/api/  |
| Admin    | http://localhost:4781/admin/|

Stop:

```bash
docker compose down
```

## API contract (frontend ↔ backend)

Base URL: `http://localhost:4781/api`

| Method | Endpoint                 | Auth  | Purpose                |
|--------|--------------------------|-------|------------------------|
| GET    | `/courses/`              | No    | List/search courses    |
| GET    | `/courses/<slug>/`       | Yes   | Course + modules       |
| POST   | `/contact/`              | No    | Contact message        |
| POST   | `/auth/register/`        | No    | Create account         |
| POST   | `/auth/login/`           | No    | Login → token          |
| POST   | `/auth/logout/`          | Yes   | Invalidate token       |
| GET    | `/auth/me/`              | Yes   | Current user           |
| POST   | `/auth/forget-password/` | No    | Email reset token      |
| POST   | `/auth/change-password/` | No    | Reset with token       |
| GET    | `/subscriptions/`        | Yes   | Membership plans       |
| POST   | `/become-pro/`           | Yes   | Stripe charge + pro    |
| GET    | `/config/`               | No    | Public Stripe key      |

Auth header: `Authorization: Token <key>`

## Linting (Ruff)

Every PR and push to `main` runs Ruff via GitHub Actions (`.github/workflows/ruff.yml`).

Locally:

```bash
pip install "ruff>=0.8,<1"
ruff check backend
ruff format backend
```

Relative imports are banned (`from study...` only). Config lives in `pyproject.toml`.

## Local development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver 0.0.0.0:4781
```

### Frontend

Serve `frontend/public` on port 4780 (any static server), e.g.:

```bash
cd frontend/public
python -m http.server 4780
```

Ensure `js/config.js` points at `http://localhost:4781/api`.

## Environment variables

See `backend/.env.example` and `frontend/.env.example`.

Important backend vars:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `FRONTEND_URL`
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY`
- `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD`

## Team roles

- **Frontend (Cursor):** UI architecture, components, API integration, validation
- **Backend (Ayaz):** DRF APIs, models, auth, business logic, security

Coordinate through the API contract above. Do not couple frontend templates into Django.

## Notes

- SQLite is used for simplicity; the Docker volume `backend_db` persists DB data.
- Course media is bind-mounted from `backend/media`.
- The legacy monolithic `courses/` tree was replaced by this split architecture.
