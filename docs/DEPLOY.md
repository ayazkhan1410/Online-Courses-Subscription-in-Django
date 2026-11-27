# Deploy Study with Ayaz (free hosting)

## Architecture

| Part | Service | URL |
| --- | --- | --- |
| Frontend (React + Pages Function) | Cloudflare Pages | `https://study-with-ayaz.pages.dev` |
| Backend (Django Docker) | Render free, Singapore | `https://study-with-ayaz-api.onrender.com` |
| Database | Neon free Postgres, AWS Singapore | pooled `DATABASE_URL` (`-pooler`) |
| Email | Brevo free HTTPS API (django-anymail) | sender = verified Gmail |
| Keep-awake + jobs | cron-job.org | `/healthz` + cron POSTs |

Local docker-compose still uses Postgres + nginx SEO proxy on ports 4780/4781.

**Uploads:** Render free disk is wiped on every deploy/restart. Admin `course_image` uploads do not persist. Covers and OG images are generated in code.

## Environment variables

### Backend (Render dashboard / `render.yaml`)

| Variable | Where | Notes |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | Render (`generateValue`) | Refuse example values when `DEBUG=False` |
| `DJANGO_DEBUG` | Render | `False` in production |
| `DJANGO_ALLOWED_HOSTS` | Render | `.onrender.com` |
| `DATABASE_URL` | Render (`sync: false`) | Neon **pooled** string, `sslmode=require` |
| `MFA_ENCRYPTION_KEY` | Render (`sync: false`) | Fernet key; required when not DEBUG |
| `BREVO_API_KEY` | Render (`sync: false`) | Enables Anymail Brevo backend |
| `DEFAULT_FROM_EMAIL` | Render (`sync: false`) | `Study with Ayaz <you@gmail.com>` |
| `CORS_ALLOWED_ORIGINS` | Render | Pages origin |
| `CSRF_TRUSTED_ORIGINS` | Render | Pages origin (`https://…`) |
| `FRONTEND_URL` | Render | Pages URL (sitemap + email links) |
| `API_PUBLIC_URL` | Render | Render URL (OG image absolute URLs) |
| `GOOGLE_OAUTH_CLIENT_ID` | Render (`sync: false`) | Same client as local |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Render (`sync: false`) | Cloudflare Turnstile |
| `TURNSTILE_ALLOWED_HOSTNAMES` | Render | Pages hostname |
| `TURNSTILE_TEST_MODE` | Render | `False` in production |
| `CRON_SECRET` | Render (`sync: false`) | Header `X-Cron-Secret` |
| `YOUTUBE_API_KEY` | Render (`sync: false`) | Optional playlist sync |
| `FIVERR_PROFILE_URL` | Render (`sync: false`) | Optional |
| `DJANGO_SUPERUSER_*` | Render (`sync: false`) | Created once by `ensure_superuser` |

Local fallbacks: `POSTGRES_*` (see `backend/.env.example`).

### Frontend (Cloudflare Pages)

| Variable | Notes |
| --- | --- |
| `VITE_API_BASE_URL` | `https://study-with-ayaz-api.onrender.com/api` |
| `API_PUBLIC_URL` | Optional; Pages Function uses this (or strips `/api` from Vite URL) for SEO/robots |

## Redeploy

- **Backend:** push to `main` (Blueprint `autoDeploy: true`) or Render → Manual Deploy.
- **Frontend:** push to `main` with Git integration, or `npx wrangler pages deploy frontend/app/dist`.

## Rollback

- **Render:** Service → Events → **Rollback** to a previous deploy.
- **Cloudflare Pages:** Deployments → **Rollback to this deployment**.

## Rotate secrets

1. Generate a new value locally (never commit it).
2. Update the value in the **Render** / **Neon** / **Brevo** / **Cloudflare** dashboard only.
3. Redeploy the service that reads it.
4. For `CRON_SECRET`, also update cron-job.org job headers.
5. For `MFA_ENCRYPTION_KEY`, rotating invalidates stored authenticator secrets — warn users before changing it.

## Free-plan limits (honest)

- **Render free:** sleeps after ~15 min idle (30–60s wake); 750 instance hours/month; no outbound SMTP (use Brevo HTTPS).
- **Neon free:** ~100 compute hours/month; sleeps after ~5 min idle. Keep-awake must hit `/healthz` only (no DB). Use pooler URL + `CONN_MAX_AGE=0`. Set compute min/max **0.25 CU**.
- **Brevo free:** 300 emails/day; small Brevo footer; without a custom domain some mail may land in spam.
- **Cloudflare Pages:** generous free tier for this site size.
- **cron-job.org free:** enough for 10-minute pings + two daily/weekly jobs.

## Ops endpoints

- `GET /healthz` → `200 ok` (no DB).
- `POST /api/internal/cron/sync_playlists/` + `X-Cron-Secret`
- `POST /api/internal/cron/send_weekly_reminders/` + `X-Cron-Secret`
- `GET /api/seo/head/?path=/courses/<slug>` → `{status, head_html}`

## Admin

Created once from `DJANGO_SUPERUSER_USERNAME` / `EMAIL` / `PASSWORD` on boot. Existing users are never password-reset on reboot.
