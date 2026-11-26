# Design mockups: source of truth for the React app

**Cursor: your task is in [CURSOR_PROMPT.md](CURSOR_PROMPT.md).**

Open with `python3 -m http.server 4790 --directory design`, then visit http://localhost:4790.
The floating bar at the bottom right switches pages. Use the sun/moon button for light and dark.

| Mockup | React route |
| --- | --- |
| index.html | `/` |
| courses.html | `/courses` and `/categories/:slug` (category selected = intro panel shown) |
| course.html | `/courses/:slug` |
| learn.html | `/learn/:slug/:lessonId` |
| dashboard.html | `/dashboard` (same shell for all dashboard pages) |
| auth.html | `/login` (two states: sign in, and the 2FA code step) |

## Direction: "Night desk notebook"

- Warm paper neutrals in light mode, a dark desk at night in dark mode. One accent: burnt orange.
- Fonts: Instrument Sans for UI, JetBrains Mono for numbers and meta. Weights 400 and 500 only.
- Signature: the lesson counter `07 / 50` plus the tick ruler (`.counter`, `.ticks`). Use it only for progress.
- Course covers are generated in code (`.cover`): ruled paper, a colored spine per category, a short title. No YouTube thumbnails on cards.
- The only rich, 3D moment is the home hero desk (notebook, phone, pencil) in pure CSS 3D. No other glow, gradient or 3D anywhere.

## Rules for porting

- Copy every token from `styles.css` `:root` and `[data-theme="dark"]` into `tokens.css` exactly.
- Port each class as a component: Nav, Footer, CourseCard, Cover, Counter, Ticks, Chip, Panel, DashboardShell, LessonList, OtpInput.
- Category ink colors (`--ink-*`) appear only on covers and category dots.
- Lesson titles from YouTube get cleaned: `Day 08/50 - How to Create List in Python | Python Full Course` becomes counter `Day 08` + title `How to create a list in Python`.
- `data.js` is mock data. Real numbers come from the API. `.mock-bar` and the auth state switch are mockup-only.
