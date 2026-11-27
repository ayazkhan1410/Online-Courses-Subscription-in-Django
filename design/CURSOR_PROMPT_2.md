# Cursor task 2: Services, Paths, About pages + sign-up verification and 2FA choice

Do this after CURSOR_PROMPT.md. Use the same design system (design/styles.css tokens,
Nav, Footer, Panel, CourseCard, Cover, Counter/Ticks, type scale). No new colors, no
gradients, no glow, no emoji, no icons in headings. Every page responsive at 375px with no
horizontal scroll. Copy below is final: use it word for word.

---

## A. Page content

### /services

Layout: page head (h1 + lead + two buttons), then 3 service rows as Panels in a list
(name left, what you get middle, "Starting point" meta right), then "How I work" as 4
numbered steps (mono numbers 01–04), then a contact Panel at the bottom.

- h1: I build web products with Django and React
- Lead: Backends, dashboards and full apps for founders and small teams. You talk to the
  person who writes the code, from the first call to the deploy.
- Buttons: "Start a project" (primary, goes to /contact?topic=project) and
  "See my work" (secondary, goes to /about#work)

Services:
1. Django and DRF backends
   - REST APIs, admin panels, auth with Google and two-factor login, payments, background
     jobs and Postgres data models.
   - Meta: "API, admin, auth"
2. React frontends and dashboards
   - Fast, responsive interfaces in React and TypeScript, wired to your API, with light and
     dark themes and tests.
   - Meta: "React, TypeScript"
3. Deploys and maintenance
   - Docker setups, CI, servers and fixes for apps that are already live. Monthly support if
     you need it.
   - Meta: "Docker, CI, support"

How I work:
- 01 Call. A 30 minute call about what you need and what it should cost.
- 02 Plan. A written scope with milestones and a fixed price for each one.
- 03 Build. Weekly demos on a staging link, so you see progress, not promises.
- 04 Launch. Deploy, a handover walkthrough, and two weeks of free fixes.

Contact panel:
- Title: Have a project in mind
- Text: Tell me what you're building and when you need it. I reply within two working days.
- Button: "Send a message" → /contact?topic=project
- Small link: "Or hire me on Fiverr" → (read the URL from settings FIVERR_PROFILE_URL;
  hide the link if empty)

### /paths

A path is an ordered list of existing courses from the catalog (no new videos). Add a
`LearningPath` model: title, slug, summary, level, sort_order, is_published, and an ordered
`PathStep` (path FK, course FK, sort_order, note). API: GET /api/paths/, GET /api/paths/<slug>/.
Admin with inline steps. Seed the 5 paths below with a `seed_paths` command (idempotent),
matching courses by youtube_playlist_id from the catalog files; skip a step if its course
isn't published.

/paths page: h1 + lead, then path Panels in a grid of 2. Each Panel: title, summary,
level + "N courses" meta, and the course names as a numbered mono list (01, 02, 03).
Logged-in users see the Counter + Ticks with how many courses of the path they finished.
/paths/:slug page: title, summary, then the steps as CourseCards in order, each with its
note above it.

- h1: Learning paths
- Lead: Not sure where to start? Follow one of these in order. Each path uses free courses
  from the library, picked so the next one starts where the last one ended.

Paths (steps in this order):
1. Python from zero (Beginner)
   - Summary: Write your first program, then build small projects until Python feels natural.
   - Steps: 50 Days of Python Programming challenge (Study with Ayaz) — note "Start here. One
     lesson a day." → 50 Days 50 Python Programs (Study with Ayaz) — note "Practice what you
     learned." → Python Programming Beginner Tutorials (Corey Schafer) — note "Same topics,
     explained in English, with more depth."
2. Django backend developer (Beginner to intermediate)
   - Summary: From Python basics to a deployed Django app with users, a database and an API.
   - Steps: Python Programming Beginner Tutorials (Corey Schafer) → Django Tutorials (Corey
     Schafer) — note "Build a full blog step by step." → Django and React full stack (Tech
     With Tim) — note "Connect Django to a React frontend." → Docker Tutorial for Beginners
     (TechWorld with Nana) — note "Package and ship it."
3. React frontend developer (Beginner)
   - Summary: Learn React the modern way, then add login and real data.
   - Steps: Full Modern React Tutorial (Net Ninja) → React Tutorials (Dave Gray) → React
     Login, Registration and Authentication (Dave Gray)
4. Crack coding interviews (Intermediate)
   - Summary: Data structures and algorithms in the order most interviewers ask them.
   - Steps: Algorithms (Abdul Bari) — note "Understand the ideas first." → A2Z DSA (take U
     forward) — note "Then solve problems topic by topic."
5. Start freelancing (Beginner)
   - Summary: Get your first clients once you can build something useful.
   - Steps: Fiverr Gig rank Amazing tips and tricks (Study with Ayaz) → the published
     playlists in the Freelancing and Career category, in their sort order.

### /about

Layout: two columns on desktop (text left, a quiet Panel right with facts), stacked on
mobile. Then a "#work" section listing projects from the database (add a `Project` model:
title, slug, summary, tech (comma list), live_url, repo_url, sort_order, is_published;
admin only; show nothing and hide the section if there are no published projects). Then
the attribution section.

- h1: Hi, I'm Ayaz
- Paragraphs:
  - I'm a software developer from Pakistan. I build backends and web apps with Python,
    Django and React, and I teach programming in Urdu and Hindi on my YouTube channel,
    Study with Ayaz.
  - I started the channel to explain things the way I wish someone had explained them to
    me: one small idea at a time, with code you type along with. My 50 Days of Python
    challenge is still where most people start.
  - This site grew out of the questions I kept getting: which course should I watch next,
    and is it any good. So I collected the best free playlists I know, from my channel and
    from other teachers, put them in order, and added a way to track every lesson. It's
    free and it will stay free.
- Facts Panel (label left, value right, values from the API where they exist):
  Courses in the library = published course count; Categories = category count;
  Teaching languages = Urdu, Hindi, English; YouTube = link "Study with Ayaz" to
  https://www.youtube.com/@studywithayaz; Work = link "Hire me" to /services.
- Buttons under text: "Browse courses" (primary) and "Work with me" (secondary → /services)
- Attribution section title: About the courses
  - Text: Courses from other teachers belong to them. Videos play from YouTube, and every
    course links to the creator's channel. If you're a creator and want your playlist
    removed or updated, write to me on the contact page and I'll do it within a week.

---

## B. Sign-up email verification

1. Email sign-up: create the user with `is_active=False` (or `email_verified=False` if that
   breaks existing flows; pick one and test it). Send a 6-digit code to the email.
   - Code: random 6 digits, stored hashed, expires in 10 minutes, max 5 wrong tries, then
     the code is dead and the user must request a new one. Resend allowed after 60 seconds,
     max 5 sends per hour per email. Reuse the hashing and lockout helpers in backend/mfa/utils.
   - Endpoints: POST /api/auth/register/ (returns `{verification_required: true, email}`),
     POST /api/auth/verify-email/ {email, code} (activates and returns the normal login
     payload), POST /api/auth/verify-email/resend/ {email}. Resend always returns the same
     message so it can't be used to check if an email exists.
   - Login with a correct password on an unverified account returns
     `{verification_required: true, email}` and sends a fresh code; the UI goes to the
     verify screen.
   - Existing users in the database are treated as verified (data migration).
2. Continue with Google: Google already verified the email, so no code. Create or log in the
   user directly, mark the email verified. If an unverified email account exists with the
   same email, link it to Google and mark it verified.
3. React: /register → after submit go to /verify-email with the email shown, a 6-box
   OtpInput (same component as the 2FA step), "Resend code" with a 60s countdown, and
   "Use a different email". Same card style as auth.html.
   Email text: subject "Your Study with Ayaz code: 123456", body "Your code is 123456. It
   expires in 10 minutes. If you didn't sign up, ignore this email."

## C. Two-factor login is optional and the user chooses the method

1. 2FA is OFF by default for everyone. Nobody is forced to set it up.
2. Dashboard → Security page (DashboardShell). Shows status and lets the user choose:
   - Authenticator app: show QR + manual key, confirm with a 6-digit code, then show 10
     recovery codes once with "Download" and "I saved them" buttons.
   - Email code: confirm by entering a code sent to their email. No recovery codes needed.
   - Switch method or turn off: requires the current password (or, for Google-only
     accounts with no password, a code from the current method).
   - Copy: title "Two-step login", text "Ask for a code when you log in with your email and
     password. Choose an authenticator app or a code sent to your email."
3. When 2FA is on, email + password login returns `{mfa_required, challenge_token, methods}`
   and the UI shows the auth.html 2FA step with only the user's chosen method (plus
   "Use a recovery code" for app users).
4. Google login never asks for a code: no sign-up code and no 2FA step, because Google
   handles that account's security. Write this on the Security page as a note:
   "When you continue with Google, Google protects your sign-in, so we don't ask for a code."
5. Keep the existing protections from the mfa app (replay protection, lockouts, encrypted
   secrets, security alert email when 2FA is turned on or off).

## Tests

Backend: register sends a code and the user can't log in until verified; wrong code
5 times locks the code; expired code fails; resend cooldown; Google sign-up skips
verification and links an existing unverified account; existing users count as verified;
2FA off by default; enable app method and email method; login asks only for the chosen
method; Google login skips 2FA even when it's on; paths API returns only published paths
and steps in order; projects hidden when none are published.
Frontend: Vitest for OtpInput and the verify-email flow; Playwright for register → verify
→ dashboard (read the code from Django's locmem/console email backend in tests), the
security page method choice, and /services, /paths, /about at 375px with no horizontal
scroll. Run everything, run `docker compose up -d --build`, show me the test summary.
