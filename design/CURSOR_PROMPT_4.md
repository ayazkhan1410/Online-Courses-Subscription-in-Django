# Cursor task 4: learning features, findability and design touches

Do this on a new branch `feature/learning-features` from the current branch. Same rules as
design/README.md: tokens only, no new colors, no gradients, no glow, no emoji, weights 400/500,
Instrument Sans + JetBrains Mono, sentence case, every page fine at 375px. Reuse existing
components (Cover, Counter, Ticks, Chip, Panel, CourseCard, LessonList, DashboardShell,
EmptyState). Respect `prefers-reduced-motion` for every animation. Work in the order below,
commit after each numbered part with a clear message. Don't push.

What already exists (reuse, don't rebuild): `Courses.language` field and the `?language=`
filter in CourseListAPIView; `CourseModule` = a lesson; `LessonProgress(user, module,
completed)`; the Notes tab in LearnPage (textarea, not saved yet); the YouTube `<iframe>` in
LearnPage; the playlist import form in courses admin; the email helpers in backend/mfa/utils.

---

## 1. Resume at the exact second

- Replace the plain iframe with the YouTube IFrame Player API (load
  `https://www.youtube.com/iframe_api` once, a small `useYouTubePlayer` hook). Keep
  `youtube-nocookie.com` if it's used now.
- Add `position_seconds` (PositiveInteger, default 0) to `LessonProgress`. Save it every 15s
  while playing, on pause, and on page hide (`visibilitychange`, use `navigator.sendBeacon` or
  `fetch keepalive`). Endpoint: PATCH the existing progress endpoint or add
  `POST /api/learning/progress/position/ {module_id, seconds}`. Throttle it server side.
- On opening a lesson, start at the saved second (minus 3s). If the user was in the last 15s
  of the video, start from 0. Show a quiet line "Resumed at 12:40" with a "Start over" link.
- Auto-mark complete when 90% watched (the user can still unmark).

## 2. Notes with timestamps

- Model `LessonNote(user, module, seconds, body ≤ 2000 chars, created_at, updated_at)`.
  API: list/create per lesson, update, delete; only the owner can see or change their notes.
- Notes tab: input "Add a note at 04:12" (current player time, mono), Enter saves. List below,
  newest last, each row `04:12` (mono, link) + text + edit/delete on hover/focus. Clicking the
  time seeks the player there and plays.
- Dashboard → new "Notes" page in DashboardShell sidebar: all notes grouped by course, then
  lesson, each linking to `/learn/:slug/:lessonId?t=252`. Support `?t=` on the learn page.
- Remove "Notes are not saved yet." placeholder; empty state: "No notes for this lesson yet.
  Press N to write one at the current time." (see shortcut list in part 9)

## 3. Language filter

- Courses page and category pages: a chip row "All · Urdu / Hindi · English" using
  `?language=`; keep it in the URL so it's shareable and survives refresh. Combine with the
  existing category/level filters.
- Course cards and course page show the language as quiet mono meta ("Urdu / Hindi").
- Make sure every seeded course has the right language (own playlists = Urdu/Hindi, the
  others English unless the catalog file says otherwise). Fix the seed if needed.

## 4. Completion card (share, not a certificate)

- Model `Completion(user, course, completed_at, share_id = random 10-char slug, unique)`.
  Created automatically when every lesson of an enrolled course is complete. Never deleted if
  the user later unmarks a lesson.
- Public page `/done/:share_id` (no login): a large Cover-style card: course cover spine in the
  category ink, course title, "50 / 50 lessons", full Ticks row all filled, the user's display
  name, "Finished Nov 2026", teacher name + "on Study with Ayaz". Button "Start this course"
  for visitors. Text says plainly it's a completion record, not a certificate.
- On the moment of finishing (last lesson marked), show a Panel on the learn page: "You
  finished 50 Days of Python" + "Share" (Web Share API, fallback copy link) + "View card".
  Dashboard gets a "Finished" list linking to the cards.
- Server-rendered Open Graph image for each card at `/api/og/done/:share_id.png` (Pillow,
  1200×630, same look: paper bg, spine, title, counter, ticks). Cache it.
- A privacy toggle in Settings: "Show my name on completion cards" (default on). Off = "A
  learner".

## 5. Findable on Google

- Per-page `<title>` and meta description for every route (`usePageTitle` already exists;
  extend it to description + canonical + og:title/og:description/og:image).
- Because it's a SPA, bots need real HTML: add a Django view that serves `index.html` with the
  meta tags filled for `/courses/:slug`, `/paths/:slug`, `/categories/:slug`, `/done/:id` and
  the static pages (nginx in the frontend container forwards those HTML requests to it, or
  Django injects into the built index.html; pick the simpler one for our Docker setup and
  document it in README). Users still get the normal React app.
- OG image per course at `/api/og/course/:slug.png` (same Pillow renderer as part 4: the
  course cover). Home and static pages use one default OG image.
- `/sitemap.xml` (django.contrib.sitemaps: courses, paths, categories, static pages) and
  `/robots.txt` (allow all, disallow /dashboard, /learn, /api, point to the sitemap).
- JSON-LD on course pages: `Course` with provider "Study with Ayaz" and the creator name.

## 6. Streak and daily goal

- A day counts when the user completes at least one lesson (in their timezone; save
  `timezone` on the user from the browser, default Asia/Karachi). Compute current and longest
  streak from LessonProgress dates; no cron needed.
- Settings: daily goal 1, 2 or 3 lessons (default 1).
- Dashboard: replace or join the stats row with "12 day streak" (mono figure) and a
  "this week" strip: 7 day cells Mon–Sun using the Ticks look, filled when the goal was met,
  today outlined. Below, "Longest 21 days". No flames, no confetti, no badges.

## 7. Suggest a playlist

- Model `PlaylistSuggestion(url, note ≤ 500, email optional, user optional, status:
  new/added/declined, created_at)`. Validate it's a YouTube playlist URL with the existing
  `playlist_id_from_url`. Reject duplicates of a playlist already in the catalog with a
  friendly message and a link to it. Throttle like contact.
- Small form at the bottom of /courses and on About › About the courses: "Know a free
  playlist that belongs here?" Admin list with filters and an action "Import" that sends the
  URL into the existing playlist import flow.

## 8. Auto-sync playlists

- Management command `sync_playlists` that re-fetches every published course's playlist and
  adds new videos as new lessons at the end (never deletes or reorders lessons people have
  progress on; mark removed videos `is_available=False` and hide them). Uses the existing
  import code and YOUTUBE_API_KEY from env; does nothing and logs a warning if the key is
  missing.
- Admin action "Sync now" on courses. Log what changed.
- Scheduling comes with deployment; for now document `python manage.py sync_playlists` in
  README.

## 9. Lesson page design touches

- Keyboard shortcuts on /learn (ignored while typing in an input/textarea): `K` or `Space`
  play/pause, `J` / `L` back/forward 10s, `M` mark complete, `N` new note at the current time,
  `Shift+N` / `Shift+P` next/previous lesson, `F` focus mode, `?` opens a small shortcuts
  sheet. Show keycaps (`<kbd>` styled with tokens: sunken bg, 1px line-strong border, mono 12px,
  radius 4) in the sheet and as hints next to "Mark complete" and in the notes empty state.
- Tick motion: marking a lesson complete fills its tick on the ruler (scale-y from 0 to 1, 200ms
  ease-out) and the counter rolls from 07 to 08 (old number slides up out, new one in, 200ms).
  Unmarking reverses it. Nothing else animates.
- Focus mode: hides nav, lesson sidebar and footer, centers the player at max 1100px with the
  notes underneath. `F` or a quiet button toggles it; remembered in localStorage.
- Practice task (own courses only): optional `practice_task` text field (markdown-lite: paragraphs
  and code blocks) on CourseModule, editable in admin. Shown under the player as a Panel
  "Try it yourself" with a "Show hint" disclosure if `practice_hint` is set. Hidden when empty.
  Don't invent tasks; leave them empty for Ayaz to write.

## 10. Other design touches

- Home for logged-in users: replace the desk hero with a "Continue" block: the course Cover,
  "Day 08 · Lists in Python" (cleaned title), Counter + Ticks, buttons "Continue" (primary) and
  "All my courses". Logged-out visitors keep the desk scene. No layout jump on load (render the
  right one after auth state is known; skeleton matches the final size).
- Path detail as a route: the steps stacked vertically joined by a 1px line-strong rail; each
  step is a node (12px circle: filled accent when the course is finished, outlined when started,
  line-strong when not) + its note + the CourseCard. Logged-out users see all nodes outlined.
- 404 page: a single blank ruled notebook page (same ruled background as auth) with the margin
  line, mono "404", h1 "This page isn't in the notebook", and buttons "Browse courses" and
  "Go home".

## 11. Weekly "your next lesson" email

- Opt-in only: Settings toggle "Weekly reminder email" (default off). Model fields on the user:
  `weekly_email` bool, `unsubscribe_token`.
- Command `send_weekly_reminders`: for each opted-in user with an unfinished enrollment and no
  lesson completed in the last 3 days, send one plain email: subject "Your next lesson: Lists in
  Python", body with the course name, "Day 08 of 50", a link straight to the lesson, and a one-click
  unsubscribe link (`/api/email/unsubscribe/<token>/`, no login, also add the List-Unsubscribe
  header). Never more than one email per user per 7 days (store `last_reminder_at`).
- Works with the console/file email backend locally. Scheduling comes with deployment.

---

## Tests

Backend: position save and resume rules (last 15s → 0); 90% auto-complete; notes owner-only
access; language filter; completion created on last lesson and kept after unmark; public card
hides name when the setting is off; OG image returns a PNG; sitemap and robots; meta tags in the
HTML for a course URL; streak calculation across days and timezones; suggestion URL validation
and duplicate check; sync adds new videos without touching existing progress and does nothing
without an API key; weekly reminder rules (opt-in, 3 days idle, once per 7 days, unsubscribe).
Frontend: Vitest for the shortcut hook (ignored in inputs), tick/counter animation states,
notes timestamp formatting, language chips in the URL. Playwright: resume a lesson at the saved
time (mock the YouTube API in tests), add a note and click its time, finish a course and open
the share card logged out, language filter, keyboard shortcuts sheet, focus mode, logged-in home
Continue block, path route page, 404 page, and every new page at 375px with no horizontal
scroll.

Run everything, run `docker compose up -d --build`, and show me the test summary plus a list of
new env vars (YOUTUBE_API_KEY etc.) to add to `.env.example`. Never commit `.env`, `.cursor/`,
the zip or any real key.
