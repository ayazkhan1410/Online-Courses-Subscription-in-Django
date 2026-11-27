# Deploy Study with Ayaz (free hosting)

## Architecture

| Part | Service | URL |
| --- | --- | --- |
| Frontend (Vite SPA) | **Vercel** (`frontend/app`) | `https://study-with-ayaz.vercel.app` |
| Backend (Django) | **Vercel** (`backend`, region `sin1`) | `https://study-with-ayaz-api.vercel.app` |
| Database | Neon free Postgres, AWS Singapore | pooled `DATABASE_URL` (`-pooler`) |
| Email | Brevo free HTTPS API (django-anymail) | sender = verified Gmail |
| Keep-awake + jobs | cron-job.org | `GET /healthz` + cron POSTs |

**Not used:** Cloudflare Pages, Render. Local docker-compose still runs Postgres + nginx on 4780/4781 for development.

SEO on the frontend project: `frontend/app/vercel.json` rewrites `/robots.txt`, `/sitemap.xml`, and public marketing routes to the API so crawlers get Django meta. Sitemap/robots **loc** URLs always use `FRONTEND_URL` (the frontend host), never the API request host.

**Uploads:** Vercel is read-only except `/tmp`. Do not rely on admin `course_image` uploads. Covers and OG images are generated in memory/cache.

**Static files:** `STATIC_ROOT` is set; Vercel collects and serves `/static/` for `/admin`. WhiteNoise remains for local Docker.

## Backend Vercel project

- Root Directory: `backend`
- Framework: Django
- Production branch: `main` (use `deploy/free-hosting` only while verifying)
- Region: Singapore (`sin1` in `backend/vercel.json`)
- Build: `bash build.sh` (migrate → optional seed → ensure_superuser → collectstatic). Failed migrate fails the deploy.
- Set `SEED_ON_BUILD=1` for a one-shot seed in the build (faster bulk paths), or run `seed_catalog` / `seed_paths` once from a machine near Neon.

### Generate secrets (your terminal only — never paste into chat or git)

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"   # DJANGO_SECRET_KEY or CRON_SECRET
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"  # MFA_ENCRYPTION_KEY
```

### Environment variables (backend project)

**Secrets:**

| Name | Notes |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** (`-pooler`) + `sslmode=require` |
| `DJANGO_SECRET_KEY` | Strong random |
| `MFA_ENCRYPTION_KEY` | Fernet key |
| `CRON_SECRET` | `X-Cron-Secret` header |
| `DJANGO_SUPERUSER_USERNAME` / `EMAIL` / `PASSWORD` | Created once at build |
| `GOOGLE_OAUTH_CLIENT_ID` | OAuth web client |
| `BREVO_API_KEY` | Optional until Brevo is ready |
| `DEFAULT_FROM_EMAIL` | e.g. `Study with Ayaz <you@gmail.com>` |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Optional until Turnstile exists |
| `YOUTUBE_API_KEY` | Optional |
| `FIVERR_PROFILE_URL` | Optional |

**Plain:**

| Name | Example |
| --- | --- |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | `.vercel.app` |
| `FRONTEND_URL` | `https://study-with-ayaz.vercel.app` |
| `CORS_ALLOWED_ORIGINS` | `https://study-with-ayaz.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | `https://study-with-ayaz.vercel.app` |
| `API_PUBLIC_URL` | `https://study-with-ayaz-api.vercel.app` |
| `TURNSTILE_TEST_MODE` | `True` until keys exist |
| `TURNSTILE_ALLOWED_HOSTNAMES` | `study-with-ayaz.vercel.app` |

Set the same secrets for **Build** and **Production**. Vercel sets `VERCEL=1`.

## Frontend Vercel project

- Root Directory: `frontend/app`
- Framework: Vite
- Build: `npm ci && npm run build` · Output: `dist`
- `frontend/app/vercel.json` rewrites SEO routes to `https://study-with-ayaz-api.vercel.app`

| Variable | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://study-with-ayaz-api.vercel.app/api` |

## Local / Docker

Use `POSTGRES_*` or local `DATABASE_URL`. See `backend/.env.example`.

## Redeploy / rollback

Both apps: push `main`, or Vercel → Redeploy / Rollback on that project.

## Rotate secrets

Update in the Vercel / Neon / Brevo dashboards only, then redeploy. Rotating `MFA_ENCRYPTION_KEY` invalidates authenticator secrets. Update cron-job.org when rotating `CRON_SECRET`.

## Free-plan limits

- **Vercel Hobby:** serverless cold starts; ping `/healthz` every 10 minutes if desired.
- **Neon free:** ~100 CU-hours/month; idle after ~5 min. Keep-awake must **not** hit the DB. Pooler + `CONN_MAX_AGE=0`. Compute 0.25 / 0.25 CU.
- **Brevo free:** 300 emails/day; footer; spam risk without a custom domain.

## Ops endpoints

- `GET /healthz` → `200 ok` (no DB)
- `POST /api/internal/cron/sync_playlists/` + `X-Cron-Secret`
- `POST /api/internal/cron/send_weekly_reminders/` + `X-Cron-Secret`
- `GET /api/seo/head/?path=/courses/<slug>` → `{status, head_html}`

## cron-job.org

1. Keep awake: `GET https://study-with-ayaz-api.vercel.app/healthz` every 10 minutes  
2. Sync playlists: `POST …/api/internal/cron/sync_playlists/` daily 03:00 Asia/Karachi  
3. Weekly reminders: `POST …/api/internal/cron/send_weekly_reminders/` Mondays 18:00 Asia/Karachi  

## Admin

Created once from `DJANGO_SUPERUSER_*` during build. Existing users are never password-reset on rebuild.

## Reference

Former Render Blueprint (unused): `docs/render.yaml.reference`.
