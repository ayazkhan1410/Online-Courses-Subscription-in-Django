# Deploying Study with Ayaz

Everything runs on free plans with no custom domain.

| Part | Where | Address |
| --- | --- | --- |
| Website (React, `frontend/app`) | Vercel project `study-with-ayaz` | https://study-with-ayaz.vercel.app |
| API + admin (Django, `backend`) | Vercel project `study-with-ayaz-api` | https://study-with-ayaz-api.vercel.app |
| Database | Neon free Postgres, project `study-with-ayaz` (Singapore) | pooled `DATABASE_URL` |
| Email (sign-up codes, 2FA) | Brevo free API | sender `programmingwithayaz@gmail.com` |
| Google sign-in | Google Cloud project "study with ayaz" (personal account) | OAuth web client |

Both Vercel projects deploy automatically from `main`.

---

## 1. Deploying a change (day to day)

`main` is protected: nobody can push to it directly, including the owner. Every change goes
through a pull request.

1. Create a branch from `main`:
   ```bash
   git switch main && git pull
   git switch -c fix/short-description
   ```
2. Make the change and run the checks:
   ```bash
   docker compose exec backend python manage.py test
   cd frontend/app && npx vitest run && npx tsc -b --noEmit && npx eslint src
   ```
3. Push the branch and open a pull request:
   ```bash
   git push -u origin fix/short-description
   gh pr create --fill
   ```
   Vercel builds a **preview** of the branch and comments the preview links on the PR.
   Open them and check the change.
4. Merge the PR on GitHub (only the repo owner can). Vercel deploys `main` to production in
   about a minute.
5. Check https://study-with-ayaz-api.vercel.app/healthz returns `ok` and the site loads.

### If a deploy breaks the site

Vercel → the project → **Deployments** → open the last good deployment → **⋯ → Instant
Rollback**. Then fix it in a new PR.

### Database changes

`backend/build.sh` runs `migrate` on every backend deploy. A failing migration fails the
build, so a broken deploy never goes live. Make migrations backwards compatible, because the
old code keeps serving until the new build finishes.

### Adding or changing a setting

Vercel → `study-with-ayaz-api` → **Settings → Environment Variables** → edit → **Save**, then
**Deployments → ⋯ → Redeploy** on the latest production deployment. Settings only apply to new
deployments.

---

## 2. Loading or refreshing the course catalog

Seeding over the internet is slow from Vercel's build machines, so it is off in the build
(`SEED_ON_BUILD` unset). Run it from your own computer against Neon. The database address is
fetched by the Neon CLI and never printed:

```bash
npx neonctl auth   # once, opens the browser
DATABASE_URL=$(npx neonctl connection-string --project-id old-violet-28696143 --pooled --database-name neondb --role-name neondb_owner) \
  docker compose run --rm --no-deps -e DATABASE_URL --entrypoint python backend manage.py seed_catalog
```

Run the same command with `seed_paths` afterwards. Both commands are safe to run again.

---

## 3. Settings reference

### Backend (`study-with-ayaz-api`)

Secrets (type "Secret" in Vercel, never in git or chat):

| Name | What it is |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string (host contains `-pooler`) |
| `DJANGO_SECRET_KEY` | random, `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `MFA_ENCRYPTION_KEY` | Fernet key, `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`. Changing it breaks existing authenticator-app 2FA |
| `CRON_SECRET` | random, sent as `X-Cron-Secret` to the cron endpoints |
| `DJANGO_SUPERUSER_PASSWORD` | admin password, used only when the admin doesn't exist yet |
| `BREVO_API_KEY` | Brevo **API** key (starts with `xkeysib-`), not an SMTP key |

Plain values:

| Name | Value |
| --- | --- |
| `DJANGO_DEBUG` | `False` |
| `FRONTEND_URL`, `FRONTEND_INTERNAL_URL`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` | `https://study-with-ayaz.vercel.app` |
| `API_PUBLIC_URL` | `https://study-with-ayaz-api.vercel.app` |
| `GOOGLE_OAUTH_CLIENT_ID` | the OAuth client ID (public) |
| `DEFAULT_FROM_EMAIL` | `Study with Ayaz <programmingwithayaz@gmail.com>` |
| `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL` | `ayaz`, your email |
| `TURNSTILE_TEST_MODE` | `True` until Turnstile keys are added |
| `YOUTUBE_API_KEY`, `FIVERR_PROFILE_URL`, `TURNSTILE_*` | optional |

Project settings: Root Directory `backend`, framework Django, region `sin1` (in
`backend/vercel.json`, next to Neon), build `bash build.sh`.

### Frontend (`study-with-ayaz`)

| Name | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://study-with-ayaz-api.vercel.app/api` |

Project settings: Root Directory `frontend/app`, framework Vite. `frontend/app/vercel.json`
sends `/robots.txt`, `/sitemap.xml` and the public pages (courses, categories, paths, about…)
to the API so search engines get real titles; everything else is the React app.

---

## 4. Setting it up from scratch

Only needed for a new copy of the site.

1. **Neon:** sign in with GitHub → new project, Postgres 16, region AWS Singapore → Computes →
   Edit → set min and max to 0.25 CU → Connect → turn on Connection pooling.
2. **Vercel backend:** Add New Project → import this repo → Root Directory `backend` → add the
   backend settings above → Deploy. The build runs migrations and creates the admin.
3. **Catalog:** run section 2 once.
4. **Vercel frontend:** Add New Project → same repo → Root Directory `frontend/app` → add
   `VITE_API_BASE_URL` → Deploy.
5. **Google sign-in:** Google Cloud → Google Auth Platform → Clients → Create client → Web
   application → Authorized JavaScript origins: the website address. Fill **Branding** (app
   name, home page, `/privacy`, `/terms`, authorized domain), then **Audience → Publish app**,
   otherwise only test users can sign in. Put the client ID in `GOOGLE_OAUTH_CLIENT_ID`.
6. **Brevo:** finish sign-up (the address you give is printed in every email) → Senders →
   verify your Gmail → SMTP & API → **API keys** → Generate. Then Security → Authorized IPs →
   **Deactivate for API keys**: Vercel's IP addresses change, so the block would stop every email.
7. Redeploy the backend and check: `/healthz`, `/admin/`, Google sign-in, an email sign-up code.

---

## 5. Optional scheduled jobs (cron-job.org)

Not set up yet. Vercel doesn't sleep like Render, so no keep-awake ping is needed.

- Playlist sync: `POST https://study-with-ayaz-api.vercel.app/api/internal/cron/sync_playlists/`
  with header `X-Cron-Secret: <CRON_SECRET>`, daily. Needs `YOUTUBE_API_KEY`.
- Weekly reminders: `POST …/api/internal/cron/send_weekly_reminders/`, same header, weekly.

## 6. Free-plan limits

- **Vercel Hobby:** non-commercial use; a request after a quiet spell can take a few seconds.
- **Neon:** 100 compute-hours a month, sleeps after 5 idle minutes, 1 GB storage. Nothing
  should ping the database just to keep it awake.
- **Brevo:** 300 emails a day, a small Brevo footer, and some mail may land in spam until the
  site has its own domain.
- **Files:** Vercel's disk is read-only, so admin image uploads don't persist. Course covers
  come from YouTube thumbnails and generated images.

Old Render setup, unused: `docs/render.yaml.reference`.
