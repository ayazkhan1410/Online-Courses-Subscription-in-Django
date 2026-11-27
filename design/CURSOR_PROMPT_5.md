# Cursor task 5: new home page

Build the home page (`/`) from the mockup **`design/v2/home.html`** (open it with
`python3 -m http.server 4790 --directory design`, then http://localhost:4790/v2/home.html; the
switcher at the bottom right is mockup-only). Screenshots: `design/v2/shots/home-*.png`.
Copy layout, spacing, type sizes and copy from the mockup. `design/v2/shared.css` holds the
thumbnail card styles. Ignore `a.html` and `b.html`: they were the two directions, `home.html`
is the final one.

`main` is protected: work on a branch `feature/home-redesign` and open a PR. Don't merge it.

## Rules (same as before)

Tokens from `tokens.css` only, Instrument Sans + JetBrains Mono, weights 400/500, sentence case,
no emoji, no new colors. The hero is always dark (`#0f0d0b`) in both themes, like the mockup.
The only gradient allowed is the neutral scrim over the thumbnail wall. Every animation stops
under `prefers-reduced-motion`. No horizontal scroll at 375px.

## Sections, top to bottom

1. **Hero with the thumbnail wall.** Three rows of real course thumbnails drifting slowly in
   opposite directions behind the text (CSS `transform` animation only, duplicated row for a
   seamless loop, rotated -6deg). Use the smaller YouTube image (`mqdefault.jpg`) for the wall
   to keep it light, `loading="lazy"` except the first row, `decoding="async"`, empty `alt`
   (decorative). Pause the animation when the hero is off screen (IntersectionObserver). On
   mobile the wall sits under the text, as in the mockup.
   Eyebrow, headline, lead, both buttons: copy from the mockup. The eyebrow numbers
   ("58 free courses · 23 teachers") come from the API.
2. **Numbers band:** courses, total lessons, learning paths, languages. Real counts from the
   API (add `lesson_count` and `creator_count` to the config endpoint if missing; cache them).
   Format with thousands separators ("2,700").
3. **Featured lesson player** (from direction A) next to "Most people start here / 50 Days of
   Python. One lesson a day."
   - Logged out: the real course "50 Days of Python Programming challenge": its thumbnail, real
     lesson titles for days 6–9 cleaned with the existing title cleaner, and a demo state of
     07 / 50 with days 6–7 ticked and day 8 as "now". Button "Start day 1" goes to the first
     lesson.
   - Logged in with an enrollment: show the user's most recent course instead, with their real
     counter, ticks, the two lessons before and after their next lesson, and the button
     "Continue day N". This replaces the old logged-in "Continue" block on home.
   - The play button opens the lesson page. Reuse Counter, Ticks and the lesson-row styles.
4. **My courses** row and **Popular from other teachers** row: horizontal scroll-snap rails of
   thumbnail cards (the existing CourseCard with thumbnails), "See all 21" / "Browse all" links.
   Popular = the published third-party courses with `is_featured` or the top ones by sort
   order, 8 max.
5. **How it works:** the 3 steps with their mini demos exactly as in the mockup (chips; a
   timestamped note line; a Ticks row). Static, no data.
6. **Learning paths:** 3 path cards with the stacked, slightly rotated thumbnails of their first
   3 courses, title and level. Data from `/api/paths/`, first 3 by sort order; link to
   `/paths/:slug`.
7. **Closing:** "Pick a course. Press play. Come back tomorrow." + "Create a free account"
   (logged in: "Browse courses").

Sections 2–7 fade up once when scrolled into view (the mockup's `.reveal`), no other motion.

## Performance and SEO

- Above-the-fold: hero text renders immediately (no waiting on the API); the wall and numbers
  fill in when data arrives, with fixed sizes so nothing jumps (no layout shift).
- Keep the existing home page title and meta. The OG image stays.
- Lighthouse on the production build: performance 85+ on mobile, accessibility 95+. Report the
  numbers.

## Tests

- Vitest: numbers band formatting, featured player logged-out vs logged-in states, paths
  section renders 3 cards from mocked data, reduced-motion disables the wall animation class.
- Playwright: home loads with thumbnails visible, hero text visible before API data resolves
  (delay the API in the test), no horizontal scroll at 375px and 1440px, light and dark
  screenshots of the full page saved to `frontend/app/e2e/screenshots/`.

Run all tests, eslint, tsc, `docker compose up -d --build`, push the branch, open the PR, and
send me the test summary, the Lighthouse numbers and the Vercel preview link from the PR.
