# Cursor: switch the backend host from Render to Vercel (free, no card)

Render can't be used (Ayaz's old Render workspace is suspended for an unpaid invoice and Render
won't create a new free one). Hugging Face Spaces can't be used either (free Docker CPU now
needs PRO, and Spaces block outbound port 5432, so Neon won't connect). Neon is already created
(project study-with-ayaz, Postgres 16, Singapore, 0.25 CU, pooling on).

New plan: Django runs on **Vercel** (Python runtime, zero-config Django, Hobby plan, no card).
Frontend stays on Cloudflare Pages. Database stays Neon. Email stays Brevo (HTTPS API).
Keep everything else from design/CURSOR_DEPLOY.md that still applies (healthz, DATABASE_URL,
WhiteNoise not needed on Vercel but harmless locally, ensure_superuser, anymail, cron endpoints,
SEO head endpoint + Pages Function, waking message, docs). Work on `deploy/free-hosting`.

## Code changes

1. **Vercel project in `backend/`:** Vercel detects Django from `manage.py` and
   `WSGI_APPLICATION`. Set `STATIC_ROOT` so Vercel runs collectstatic and serves `/static/` from
   its CDN. Add `backend/vercel.json` only if needed (Python version 3.12, function
   `maxDuration` 60, region `sin1` Singapore so it sits next to Neon).
2. **Build-time steps instead of the entrypoint:** Vercel has no long-running boot script.
   Add a build command (in `vercel.json` or a `build.sh`) that runs, in order:
   `pip install -r requirements.txt`, `python manage.py migrate --noinput`,
   `python manage.py seed_catalog`, `python manage.py seed_paths`,
   `python manage.py ensure_superuser`, `python manage.py collectstatic --noinput`.
   They must all be idempotent and fast. A failing migrate must fail the build (so a broken
   deploy never goes live).
3. **Read-only filesystem:** on Vercel only `/tmp` is writable. Make sure nothing writes to
   the project dir at runtime: logging goes to stdout only, the file email inbox is disabled
   when `VERCEL` env is set, no `media/` writes, OG images stay in memory/cache. Grep for
   `open(`, `FileHandler`, `MEDIA_ROOT`, `.save(` on FileFields and fix anything that would
   crash.
4. **Settings when `VERCEL` is set:** `ALLOWED_HOSTS` includes `.vercel.app`;
   `SECURE_PROXY_SSL_HEADER`; `CONN_MAX_AGE=0`; DB from `DATABASE_URL` with
   `sslmode=require`; cache stays locmem (per instance, fine for throttles at this size).
5. **Size:** keep the function under Vercel's limit (check build output). Don't ship
   dev/test deps: split `requirements.txt` (runtime) from `requirements-dev.txt` if not already.
6. **`render.yaml`:** delete it (or move to `docs/` as reference). Update `docs/DEPLOY.md`
   and `.env.example` for Vercel.
7. **Frontend:** production `VITE_API_BASE_URL` = `https://<vercel-project>.vercel.app/api`.
   The Pages Function fetches SEO heads and proxies sitemap/robots from that URL.
8. Test locally: all suites green, docker-compose still works, and `vercel build` (or
   `vercel dev`) runs the Django app locally against a throwaway local Postgres. Push.

## Accounts (Ayaz + Claude do this in the browser; you just tell us the settings)

Vercel: sign up with GitHub → Add New Project → import the repo → Root Directory `backend` →
Framework preset Django (auto) → branch `deploy/free-hosting` until merged → Environment
Variables (Ayaz pastes secrets: `DATABASE_URL` from Neon, `DJANGO_SECRET_KEY`,
`MFA_ENCRYPTION_KEY`, `CRON_SECRET`, `DJANGO_SUPERUSER_*`, `GOOGLE_OAUTH_CLIENT_ID`; plain values:
`DJANGO_DEBUG=False`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`,
`API_PUBLIC_URL`, `TURNSTILE_TEST_MODE=True` until Turnstile keys exist; `BREVO_API_KEY` and
`DEFAULT_FROM_EMAIL` empty for now, email is skipped) → Deploy.

Write the exact list of env var names and which are secret at the end of `docs/DEPLOY.md`, and
tell Ayaz the commands to generate `DJANGO_SECRET_KEY`, `MFA_ENCRYPTION_KEY` and `CRON_SECRET` in
his own terminal. Then continue with Part 3 verification from CURSOR_DEPLOY.md against the
vercel.app URL (skip the email checks until Brevo is finished; Google sign-in must work).
