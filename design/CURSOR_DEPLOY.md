# Cursor task: deploy Study with Ayaz for free (frontend + backend), and keep it running

Goal: the site is live on free hosting with no custom domain, every feature works in
production, and you verified it yourself. Don't stop until the "Done means" list at the end is
all true. When a step needs Ayaz (account sign-up, clicking in a dashboard, pasting a secret),
stop, tell him exactly what to click and what to paste where, wait for him to say "done", then
continue. Work on a branch `deploy/free-hosting`, merge to main and push when verified.

## The stack (all free, no credit card)

| Part | Service | URL you get |
| --- | --- | --- |
| Frontend (React build) | Cloudflare Pages + one Pages Function | `https://study-with-ayaz.pages.dev` (pick another name if taken) |
| Backend (Django, Docker) | Render free web service, region Singapore | `https://study-with-ayaz-api.onrender.com` |
| Database | Neon free Postgres, region AWS Singapore | pooled connection string |
| Email (OTP, 2FA, reminders) | Brevo free (300 emails/day) over its HTTPS API | sender = Ayaz's Gmail, verified in Brevo |
| Keep-awake + scheduled jobs | cron-job.org free | pings and weekly jobs |

Why these choices, so you don't "improve" them away:
- Render free sleeps after ~15 min without traffic and takes 30–60s to wake. A ping every
  10 min keeps it awake. One service running all month fits the free 750 instance hours.
- Render free blocks outgoing SMTP (ports 25/465/587). Gmail SMTP will NOT work there. Send
  email through Brevo's HTTPS API instead (django-anymail).
- Render's own free Postgres is deleted after 30 days. Use Neon.
- Neon free gives 100 compute-hours a month and sleeps after 5 min idle. The keep-awake ping must
  NOT touch the database, or Neon stays on 24/7 and runs out of hours. Use the pooled
  (`-pooler`) connection string and `CONN_MAX_AGE=0` so idle Django workers don't hold Neon awake.
  In Neon, set the compute to min 0.25 / max 0.25 CU.
- Render's disk is wiped on every deploy and restart. Nothing may depend on files saved to
  `media/` in production (covers and OG images are generated, that's fine). Make admin file
  upload fields optional and note in README that uploads don't persist on the free plan.

---

## Part 1. Make the code production-ready (you do this, no accounts needed)

1. **Health check without the database:** add `GET /healthz` → `200 "ok"`. It must not open a
   DB connection and must not be throttled. This is what Render and the keep-awake ping hit.
2. **Database from one URL:** read `DATABASE_URL` when set (add `dj-database-url`), keep the
   `POSTGRES_*` fallback for docker-compose. `sslmode=require`, `CONN_MAX_AGE=0`,
   `CONN_HEALTH_CHECKS=True`. The entrypoint's wait-for-Postgres loop must use the same
   settings (simplest: `python manage.py shell -c "from django.db import connection; connection.ensure_connection()"` in a retry loop).
3. **Static files:** add WhiteNoise (`CompressedManifestStaticFilesStorage`) so `/admin` CSS
   works on Render. `collectstatic` runs during the Docker build, not at boot.
4. **Production settings** (only when `DJANGO_DEBUG=False`): `SECURE_PROXY_SSL_HEADER =
   ('HTTP_X_FORWARDED_PROTO', 'https')`, `SECURE_SSL_REDIRECT=True` (exempt `/healthz`),
   `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `CSRF_TRUSTED_ORIGINS` from env,
   HSTS 1 year (no preload). Keep the existing COOP setting for Google sign-in. Refuse to boot
   if `DJANGO_SECRET_KEY` is the example value or `MFA_ENCRYPTION_KEY` is empty.
5. **Gunicorn:** bind `0.0.0.0:${PORT:-4781}`, `--workers 2 --threads 2 --timeout 60`,
   `--access-logfile -`. Keep docker-compose working on 4781.
6. **Boot steps:** `migrate`, `seed_catalog`, `seed_paths` stay idempotent and fast (they read
   the JSON files, no network). Then `ensure_superuser` (next item). Then gunicorn.
7. **Superuser from env:** management command `ensure_superuser` that creates the admin once
   from `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD`
   (is_staff, is_superuser, is_active, email_verified=True). If the user already exists, do
   nothing (never reset the password on reboot). If the vars are missing, log and skip. Never
   print the password. Test it.
8. **Email through Brevo:** add `django-anymail[brevo]`. When `BREVO_API_KEY` is set, use
   `anymail.backends.brevo.EmailBackend`. Otherwise keep the current backends.
   `DEFAULT_FROM_EMAIL` comes from env. The weekly reminder's List-Unsubscribe headers must
   still be sent. A failed send must log an error and return a friendly API message, not a 500.
9. **Scheduled jobs over HTTPS:** Render free has no cron. Add `POST /api/internal/cron/<job>/`
   for `sync_playlists` and `send_weekly_reminders`. It requires header
   `X-Cron-Secret: <CRON_SECRET>` (constant-time compare, 404 on a bad or missing secret), runs
   the same code as the management command, and returns a short JSON summary. Test it.
10. **SEO on Cloudflare (replace the nginx proxying for production):**
    - Django: add `GET /api/seo/head/?path=/courses/<slug>` that returns
      `{status, head_html}` using the existing `seo/meta.py` (same tags as now, 404 status for
      unknown slugs). Cache 10 min.
    - Frontend: `frontend/app/functions/_middleware.ts` (Pages Function). For HTML requests to
      `/`, `/about`, `/contact`, `/faq`, `/privacy`, `/terms`, `/services`, `/courses*`,
      `/categories*`, `/paths*`, `/done/<id>`, it loads the static `index.html` via
      `env.ASSETS`, fetches the head from the API with a 2.5s timeout, and injects it with
      `HTMLRewriter` (replace `<title>`, append to `<head>`). If the API is slow or fails,
      serve the plain index.html. Never block the page on the backend. Every other path,
      including `/assets/*`, passes straight through as static.
    - `/robots.txt` and `/sitemap.xml`: the function proxies them from the API, and the
      sitemap URLs must use the Pages URL (setting `FRONTEND_URL`).
    - `public/_redirects` or Pages SPA fallback so deep links like `/learn/...` load the app.
    - `public/_headers`: `/assets/*` immutable 1 year; `index.html` no-cache.
    - Keep the nginx setup for docker-compose.
11. **Frontend env:** the build reads `VITE_API_BASE_URL` (production:
    `https://<render-name>.onrender.com/api`). The Google client ID and Turnstile site key
    come from the API config endpoint or `VITE_*` vars, whichever the app already uses.
12. **First load while the API wakes:** if an API call takes longer than 4s, show a quiet
    line under the content: "Waking up the server, this can take up to a minute on the free
    plan." No spinner overlay. Retry the request once.
13. **`render.yaml` (Blueprint)** at repo root: one `web` service, `runtime: docker`,
    `rootDir: backend`, `plan: free`, `region: singapore`, `healthCheckPath: /healthz`,
    `autoDeploy: true` on main. Env vars: `DJANGO_SECRET_KEY` with `generateValue: true`;
    `DJANGO_DEBUG=False`; `DJANGO_ALLOWED_HOSTS=.onrender.com`; `CORS_ALLOWED_ORIGINS`,
    `CSRF_TRUSTED_ORIGINS`, `FRONTEND_URL`, `API_PUBLIC_URL` with the real URLs; and
    `sync: false` (asked in the dashboard, never in git) for `DATABASE_URL`,
    `MFA_ENCRYPTION_KEY`, `BREVO_API_KEY`, `DEFAULT_FROM_EMAIL`, `GOOGLE_OAUTH_CLIENT_ID`,
    `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `YOUTUBE_API_KEY`, `CRON_SECRET`,
    `FIVERR_PROFILE_URL`, `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`,
    `DJANGO_SUPERUSER_PASSWORD`. Also `TURNSTILE_TEST_MODE=False` and
    `TURNSTILE_ALLOWED_HOSTNAMES=<pages host>`.
14. Update `backend/.env.example` with every new variable (placeholders only) and write
    `docs/DEPLOY.md`: the architecture table above, every env var and where it's set, how to
    redeploy, how to roll back (Render "Rollback" button, Cloudflare "Rollback to this
    deployment"), how to rotate secrets, and the free-plan limits.
15. Run all tests (backend, Vitest, Playwright, eslint, ruff), `docker compose up -d --build`,
    and confirm local still works before touching any account.

## Part 2. Accounts and dashboards (Ayaz does the clicking; you guide him one step at a time)

Give Ayaz one step, wait for "done", then the next. Never ask him to paste a secret into the
chat or into a file in the repo. Secrets go only into the Render, Cloudflare or Neon
dashboards. Generate secrets for him with commands he runs in his own terminal:
`python -c "import secrets; print(secrets.token_urlsafe(50))"` (CRON_SECRET) and
`python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
(MFA_ENCRYPTION_KEY). Tell him to save every secret in a password manager or a private note.

1. **GitHub:** confirm main is pushed and the repo is on GitHub. If it's public, double-check
   that no secrets are in the git history (`git log -p | grep -iE "secret|password|api_key"`
   and review hits). Report what you find before continuing.
2. **Neon:** sign up at neon.com with GitHub → new project "study-with-ayaz", Postgres 16, region
   AWS Asia Pacific (Singapore) → Compute settings: min 0.25, max 0.25 CU → Connect → turn on
   "Connection pooling" → copy the connection string (it contains `-pooler`). He keeps it for
   step 4.
3. **Brevo:** sign up at brevo.com → Senders, Domains & Dedicated IPs → Add a sender: name
   "Study with Ayaz", his Gmail address → confirm the email Brevo sends him → SMTP & API →
   API keys → generate a key "render". Keep it for step 4. (Free plan: 300 emails/day, emails
   include a small Brevo footer. Without our own domain some emails may land in spam; tell him
   this honestly.)
4. **Render:** sign up at render.com with GitHub → New → Blueprint → pick the repo → Render
   reads `render.yaml` → fill the `sync: false` values: `DATABASE_URL` (Neon string),
   `MFA_ENCRYPTION_KEY`, `BREVO_API_KEY`, `DEFAULT_FROM_EMAIL` (`Study with Ayaz <his Gmail>`),
   `GOOGLE_OAUTH_CLIENT_ID`, `CRON_SECRET`, the three `DJANGO_SUPERUSER_*` values (he picks a
   username, his email, and a strong password of his own: at least 16 characters, not used
   anywhere else), `YOUTUBE_API_KEY` (optional, can be empty for now), `FIVERR_PROFILE_URL`
   (optional). Turnstile keys come in step 6; leave them empty and come back. → Apply. Watch
   the deploy logs with him until `/healthz` is green. If the name `study-with-ayaz-api` is
   taken, use the URL Render gives and update every place that uses it.
5. **Cloudflare Pages:** sign up at dash.cloudflare.com → Workers & Pages → Create → Pages →
   Connect to Git → pick the repo → project name `study-with-ayaz` → framework Vite, root
   directory `frontend/app`, build command `npm ci && npm run build`, output `dist` →
   environment variable `VITE_API_BASE_URL` and the other `VITE_*` vars → Save and deploy.
   (Or, if he prefers, run `npx wrangler login` and `npx wrangler pages deploy` yourself; Git
   integration is better because main auto-deploys.) Put the final pages.dev URL into Render's
   `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`,
   `TURNSTILE_ALLOWED_HOSTNAMES`, and redeploy Render.
6. **Turnstile:** Cloudflare dashboard → Turnstile → Add widget → hostname = the pages.dev
   host → Managed → copy site key and secret key into Render (and the site key into Pages if
   the frontend reads it from a VITE var) → redeploy both.
7. **Google sign-in:** console.cloud.google.com → APIs & Services → Credentials → the OAuth
   client whose ID is in `.env.example` → Authorized JavaScript origins → add
   `https://<pages host>` → Save. (Changes can take a few minutes.) If he doesn't own that
   client, walk him through creating a new "Web application" OAuth client and use its ID.
8. **YouTube API key (optional, for playlist sync):** console.cloud.google.com → enable
   "YouTube Data API v3" → Credentials → Create API key → restrict it to YouTube Data API v3 →
   paste into Render `YOUTUBE_API_KEY`.
9. **cron-job.org:** sign up → create 3 jobs:
   - "keep awake": GET `https://<render>/healthz` every 10 minutes.
   - "sync playlists": POST `https://<render>/api/internal/cron/sync_playlists/`, header
     `X-Cron-Secret: <CRON_SECRET>`, daily 03:00 Asia/Karachi.
   - "weekly reminders": POST `.../api/internal/cron/send_weekly_reminders/`, same header,
     Mondays 18:00 Asia/Karachi.
   Turn on failure notifications to his email for all three.

## Part 3. Verify production yourself (don't skip any line)

Run these against the live URLs and show the output:

1. `curl -sI https://<render>/healthz` → 200, and Render's dashboard shows the service "Live".
2. `curl -s https://<render>/api/config/` → JSON. `/admin/` login page has its CSS.
3. Ayaz logs into `/admin/` with his superuser. You don't need the password, he tells you
   "it works".
4. `curl -s https://<pages>/courses/50-days-of-python-programming-challenge | grep -E "<title>|og:image"`
   shows the course title and an OG image URL that returns a PNG.
   `curl -s https://<pages>/sitemap.xml` and `/robots.txt` use the pages.dev URL.
5. Run the Playwright smoke suite against production
   (`PLAYWRIGHT_BASE_URL=https://<pages> npx playwright test e2e/smoke.spec.ts`), in read-only
   mode: browse, search, open a course, open a path, 375px no horizontal scroll. Don't create
   test users in production except in step 6.
6. Ayaz (or you, with his OK) registers a real account with email: the OTP email arrives
   (check spam), verify works, log out, log in. Turn on 2FA with the email method, log in
   again with the code, turn it off. "Continue with Google" works with no code. Delete the test
   account in admin afterwards if it was only for testing.
7. Trigger both cron endpoints once with the secret: 200 with a summary. Without the secret:
   404.
8. Wait 20 minutes and confirm the backend answered the keep-awake pings (cron-job.org
   history all green) and the first page load is fast.
9. In Neon's dashboard, confirm the compute goes to "Idle" when nobody uses the site (proves
   the ping doesn't keep the database awake).
10. Merge `deploy/free-hosting` into main, push, and confirm both Render and Cloudflare
    auto-deploy from that push and the site still works.

## Done means

- [ ] Frontend live on pages.dev, backend live on onrender.com, database on Neon.
- [ ] Every page loads, deep links work, SEO tags and sitemap work on the pages.dev URL.
- [ ] Email OTP, email 2FA and Google sign-in work in production.
- [ ] Ayaz can log into /admin with the superuser he chose. Nobody else knows the password.
- [ ] Keep-awake ping and both scheduled jobs are set up and green on cron-job.org.
- [ ] Neon still goes idle when nobody's on the site.
- [ ] No secret in git; `.env`, `.cursor/` and the zip are not committed.
- [ ] `docs/DEPLOY.md` written; all tests pass; main pushed and auto-deploys.
- [ ] Final message to Ayaz: both URLs, the admin URL, where each secret lives (dashboard
      names only, never the values), and the free-plan limits in one short list.
