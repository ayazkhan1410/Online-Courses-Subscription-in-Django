# Cursor task: DESIGN REPLACEMENT

The React app must match the mockups in /design exactly.

1. Read design/README.md, then open every mockup: run
   `python3 -m http.server 4790 --directory design` and visit each page in the browser
   in light and dark, at 1440px and 375px wide.
2. Replace frontend/app/src/styles/tokens.css with the exact tokens from design/styles.css
   (:root and [data-theme="dark"]). Remove any old colors, gradients, glows and fonts.
   Fonts: Instrument Sans + JetBrains Mono, weights 400/500 only.
3. Rebuild these components from the mockup markup and CSS (same class structure, same
   spacing): Nav, Footer, CourseCard, Cover (generated, no YouTube thumbnails on cards),
   Counter + Ticks, Chip, Panel, DashboardShell (sidebar), LessonList, OtpInput, ThemeToggle.
4. Rebuild pages to match the mockups: / (index.html), /courses and /categories/:slug
   (courses.html), /courses/:slug (course.html), /learn/... (learn.html),
   /dashboard (dashboard.html), /login + 2FA step (auth.html). Other dashboard pages reuse
   the DashboardShell. Other public pages reuse Nav, Footer, Panel and type scale.
5. Home hero: port the CSS 3D desk scene from index.html as a <DeskScene> component
   (pure CSS, no three.js). Remove the R3F hero and its dependencies if nothing else uses them.
   Respect prefers-reduced-motion.
6. Wire everything to the real API (no mock data). Clean YouTube lesson titles:
   "Day 08/50 - How to Create List in Python | Python Full Course" → counter "Day 08" +
   title "How to create a list in Python". Video plays via youtube-nocookie iframe in the
   learn page player box.
7. Do NOT port .mock-bar or the auth state switch.
8. Checks: no horizontal scroll at 375px on any page (add Playwright test asserting
   scrollWidth === innerWidth for every route), light and dark screenshots for each route
   in e2e, Vitest for Cover, Counter and title-cleaning function. Run all tests and
   `docker compose up -d --build`, then show me the test summary.

Do everything yourself (installs, migrations, builds, tests). Do not change files inside
/design; they are the reference.
