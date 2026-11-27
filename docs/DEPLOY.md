# Deploy Study with Ayaz (free hosting)

## Architecture

| Part | Service | URL |
| --- | --- | --- |
| Frontend (React + Pages Function) | Cloudflare Pages | `https://study-with-ayaz.pages.dev` |
| Backend (Django Python runtime) | **Vercel** Hobby, region `sin1` | `https://<project>.vercel.app` |
| Database | Neon free Postgres, AWS Singapore | pooled `DATABASE_URL` (`-pooler`) |
| Email | Brevo free HTTPS API (django-anymail) | sender = verified Gmail |
| Keep-awake + jobs | cron-job.org | `GET /healthz` + cron POSTs |

Local docker-compose still uses Postgres + nginx SEO proxy on ports 4780/4781.

**Why not Render / HF Spaces:** Render free workspace suspended; HF free Docker needs PRO and blocks Postgres port 5432.

**Uploads:** Vercel is read-only except `/tmp`. Do not rely on admin `course_image` uploads in production. Covers and OG images are generated in memory/cache.

**Static files:** `STATIC_ROOT` is set; Vercel runs `collectstatic` and serves `/static/` (admin CSS) from the CDN. WhiteNoise remains for local Docker.

## Vercel project settings

- Root Directory: `backend`
- Framework: Django (auto from `manage.py`)
- Branch: `deploy/free-hosting` until merged to `main`
- Region: Singapore (`sin1` in `backend/vercel.json`)
- Build: `bash build.sh` (migrate → seed → ensure_superuser → collectstatic). A failed migrate fails the deploy.

### Generate secrets (run in your own terminal — never paste values into chat or git)

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"   # DJANGO_SECRET_KEY or CRON_SECRET
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"  # MFA_ENCRYPTION_KEY
```

Save every value in a password manager.

### Environment variables (Vercel dashboard)

**Secrets** (`sync` / Sensitive — paste in dashboard only):

| Name | Notes |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** (`-pooler`) string with `sslmode=require` |
| `DJANGO_SECRET_KEY` | Strong random; not the example value |
| `MFA_ENCRYPTION_KEY` | Fernet key |
| `CRON_SECRET` | Header `X-Cron-Secret` for cron jobs |
| `DJANGO_SUPERUSER_USERNAME` | Admin username (created once) |
| `DJANGO_SUPERUSER_EMAIL` | Your email |
| `DJANGO_SUPERUSER_PASSWORD` | ≥16 chars, unique; never reset on rebuild |
| `GOOGLE_OAUTH_CLIENT_ID` | Google Cloud OAuth web client |
| `BREVO_API_KEY` | Optional until Brevo is ready |
| `DEFAULT_FROM_EMAIL` | e.g. `Study with Ayaz <you@gmail.com>` |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Optional until Turnstile widget exists |
| `YOUTUBE_API_KEY` | Optional playlist sync |
| `FIVERR_PROFILE_URL` | Optional |

**Plain values:**

| Name | Example |
| --- | --- |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | `.vercel.app` (code also adds `.vercel.app` when `VERCEL=1`) |
| `FRONTEND_URL` | `https://study-with-ayaz.pages.dev` |
| `CORS_ALLOWED_ORIGINS` | `https://study-with-ayaz.pages.dev` |
| `CSRF_TRUSTED_ORIGINS` | `https://study-with-ayaz.pages.dev` |
| `API_PUBLIC_URL` | `https://<project>.vercel.app` |
| `TURNSTILE_TEST_MODE` | `True` until Turnstile keys exist, then `False` |
| `TURNSTILE_ALLOWED_HOSTNAMES` | `study-with-ayaz.pages.dev` |

Vercel itself sets `VERCEL=1`.

Also mark the same secrets for **Build** and **Production** (and Preview if you use it) so `build.sh` can migrate/seed.

## Frontend (Cloudflare Pages)

| Variable | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://<project>.vercel.app/api` |
| `API_PUBLIC_URL` | `https://<project>.vercel.app` (Pages Function SEO/robots) |

## Local / Docker

Use `POSTGRES_*` or local `DATABASE_URL`. Entrypoint still migrates/seeds/gunicorn. See `backend/.env.example`.

## Redeploy / rollback

- **Backend:** push the tracked branch, or Vercel → Redeploy. Rollback: Deployments → ⋮ → Promote / Rollback.
- **Frontend:** Cloudflare Pages → Deployments → Rollback.

## Rotate secrets

Update in the Vercel (and Neon/Brevo/Cloudflare) dashboard only, then redeploy. Rotating `MFA_ENCRYPTION_KEY` invalidates authenticator secrets. Update cron-job.org when rotating `CRON_SECRET`.

## Free-plan limits

- **Vercel Hobby:** serverless function limits / cold starts; use cron-job.org to hit `/healthz` if you want fewer cold wakes.
- **Neon free:** ~100 CU-hours/month; idle after ~5 min. Keep-awake must **not** hit the DB — only `/healthz`. Pooler URL + `CONN_MAX_AGE=0`. Compute 0.25 / 0.25 CU.
- **Brevo free:** 300 emails/day; footer; spam risk without a custom domain.
- **Cloudflare Pages:** fine for this site size.

## Ops endpoints

- `GET /healthz` → `200 ok` (no DB)
- `POST /api/internal/cron/sync_playlists/` + `X-Cron-Secret`
- `POST /api/internal/cron/send_weekly_reminders/` + `X-Cron-Secret`
- `GET /api/seo/head/?path=/courses/<slug>` → `{status, head_html}`

## cron-job.org

1. Keep awake: `GET https://<project>.vercel.app/healthz` every 10 minutes  
2. Sync playlists: `POST …/api/internal/cron/sync_playlists/` daily 03:00 Asia/Karachi, header `X-Cron-Secret`  
3. Weekly reminders: `POST …/api/internal/cron/send_weekly_reminders/` Mondays 18:00 Asia/Karachi, same header  

## Admin

Created once from `DJANGO_SUPERUSER_*` during build. Existing users are never password-reset on rebuild.

## Reference

Former Render Blueprint (unused): `docs/render.yaml.reference`.
