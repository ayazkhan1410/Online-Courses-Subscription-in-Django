# Study with Ayaz — Design System (Direction A: "Night desk notebook")

## Idea
A study desk at night: a paper notebook of handwritten notes next to a laptop terminal.
Character: patient, hands-on, a little warm.
Rule of thumb: the page chrome stays quiet. Richness lives in 1–2 moments per page
(hero 3D scene, progress/streak visuals, project screenshots).

## Color tokens (CSS variables on :root, dark via [data-theme="dark"])
Light (paper):
  --bg #f7f4ee  --surface #fdfbf7  --raised #f1ece3  --paper #efe6d6
  --ink #1f1b16 (primary text)  --ink-2 #5e554a (secondary)  --ink-3 #857b6e (muted)
  --line rgba(31,27,22,.08)  --line-strong rgba(31,27,22,.16)
  --accent #c2410c (buttons, white text on it)  --accent-ink #9a3412 (accent as text)
  --accent-soft rgba(194,65,12,.10)
Dark (night desk) — default theme:
  --bg #1b1815  --surface #221e1a  --raised #2a2520  --paper #efe6d6 (notebook stays paper)
  --ink #f3eee6  --ink-2 #b7aea2  --ink-3 #8f8578
  --line rgba(243,238,230,.10)  --line-strong rgba(243,238,230,.18)
  --accent #ea7a3c (dark text #1b1815 on it)  --accent-ink #f0905a
  --accent-soft rgba(234,122,60,.14)
Semantic (toned): --ok #3f9d63 / #5fbf83 dark, --err #c43d3d / #e06a6a dark.
Rules: one accent per screen region (primary action, current selection, or one key
number). No hue-to-hue gradients, no glows, no colored shadows, no blurred blobs,
no glassmorphism. Dark mode depth = surface steps + hairlines, not shadows.
Light mode shadow max: 0 8px 24px rgba(31,27,22,.06).
Theme: follow system on first visit; user choice saved (localStorage + user profile
field later). Toggle in nav. No flash on load (set data-theme in <head> script).

## Typography
UI: "Instrument Sans" 400/500 (600 only for rare emphasis).
Mono: "JetBrains Mono" 400/500 for numbers, meta, code, lesson counters.
Fallbacks for course titles: "Noto Nastaliq Urdu", "Noto Sans Devanagari".
Scale (px): 12 meta · 14 small · 16 body · 18 lead · 20 h4 · 24 h3 · 32 h2 · 44 h1
  (mobile h1 32). Line-height: body 1.6, headings 1.15.
Sentence case everywhere. No uppercase letter-spaced labels. No italics for emphasis.
Negative tracking only on h1/h2 (-0.01em). font-variant-numeric: tabular-nums on stats.

## Spacing, radius, layout
4px grid only: 4 8 12 16 20 24 32 40 48 64 96.
Radius: controls 8, cards 12, panels 16, notebook objects 6. Pills only for tiny tags.
Container 1200px max, gutters 24 (16 on mobile). Section spacing 96 desktop / 64 mobile.
Dashboard: sidebar 256px + fluid content up to 1440px. Nav rows 36px, 4px gap.
Breakpoints: 640, 768, 1024, 1280.

## Icons
lucide-react only. 18px, stroke 1.5, color = text role. ZERO emoji in UI.
Strip emoji from YouTube titles/descriptions before rendering.

## Signature detail
Mono lesson counter, e.g. "Day 07 / 50" or "Lesson 12 / 58", in --accent-ink.
Use it ONLY where a lesson position matters: course cards (if enrolled), player,
continue-learning, dashboard. Nowhere as decoration.

## Copy rules
Plain, specific, no hype (no unlock/supercharge/seamless/AI-powered/revolutionize).
No exclamation marks. No "Welcome back! 👋" — dashboard title is the context, e.g.
"Your learning · November 2026". Buttons verb-first, 1–3 words, no trailing period.
Never invent numbers, students counts, ratings or testimonials. Empty data = honest
empty state with one action.

## Components (build once in src/components, reuse everywhere)
Button: primary (accent), secondary (hairline border), ghost. Height 40 (32 small).
  Hover = background step. Press = scale(.98). Visible focus ring 2px --accent offset 2px.
Input/Select/Textarea: height 40, radius 8, --surface bg, --line border, error text
  below in --err, label above (14px --ink-2).
Card: --surface, 1px --line, radius 12, padding 20–24. No hover scale; hover = border
  --line-strong.
CourseCard: 16:9 cover, title (2 lines max), mono meta "50 lessons · Python",
  thin 3px progress line at bottom if enrolled + lesson counter. "Pro" = quiet text tag.
Progress: 3px track --raised, fill --accent.
Stat: label (14 --ink-2), number (32 mono), comparison line ("3 more than last week").
  No sparklines or icons in stat cards.
Tag, Tabs, Modal, Toast, Skeleton loaders, EmptyState, ErrorState, Pagination,
  Avatar (initials), Breadcrumbs, Accordion (FAQ).
Nav: logo wordmark "Study with Ayaz" (500 weight, no icon tile), 4–5 links
  (Courses, Paths, Services, Work, About), theme toggle, "Log in" text link,
  ONE button ("Start learning"; "Dashboard" when logged in). Mobile: one menu button
  opening a sheet.
Footer: 4 short columns, newsletter-free, social links as text.

## Course covers
Don't show YouTube clickbait thumbnails on catalog cards. Generate consistent covers
in code per category: --paper background, notebook ruled lines, course title in
Instrument Sans, category glyph (lucide) and mono meta. YouTube thumbnail appears
only inside the player/lesson list.

## The one 3D moment: homepage hero
React Three Fiber + drei, lazy-loaded (React.lazy + Suspense) ONLY on the homepage.
Scene: an open paper notebook (ruled lines, handwritten-style code) lying on a desk,
and a laptop behind it whose screen shows a real snippet from "50 Days of Python"
(rendered as a texture from HTML/canvas). Warm single key light like a desk lamp,
soft contact shadow, matte materials. Camera tilts max ±6° toward the cursor with
damping. No floating objects, particles, orbs or auto-rotation.
Fallback: static WebP render of the same scene when prefers-reduced-motion, no
WebGL, or on screens < 768px. Budget: < 250KB JS for the 3D chunk, 60fps on a
mid laptop, never blocks first paint (text renders first).
Layout: asymmetric split, text left (headline, one line of lead, primary
"Browse courses" + secondary "Hire me"), 3D right taking >= 50% width.

## Motion
One easing: cubic-bezier(.22,1,.36,1). Durations: 120ms feedback, 200ms UI, 320ms enter.
Page transitions: 200ms fade + 8px rise (Motion / framer-motion).
Section reveal on scroll: once, 12px rise + fade, 40ms stagger, max 4 items.
Animate only transform and opacity. No looping animations except a real live
indicator. No parallax outside the hero. Respect prefers-reduced-motion everywhere.

## Page patterns
Public pages: hero → 2–4 sections → CTA strip → footer. Max one visual per section.
Auth pages: split layout, form left (max 400px), right side a calm --paper panel with
  one real quote from the course content (no fake testimonials).
Dashboard: sidebar + content. Top row = continue learning (big card with player
  thumbnail, lesson counter, resume button). Then 3–4 stats, streak calendar
  (the visual moment: 12 weeks grid, accent = days with completed lessons),
  enrolled courses list, recommended.
Course player: video left (16:9), lesson list right (sticky, current lesson
  highlighted with surface step + accent counter), notes tab under video.
Case studies: one large screenshot, then Problem / What I built / Result in 3 short
  blocks, stack as mono tags.

## Accessibility & quality
WCAG AA contrast (check accent on both themes). Keyboard reachable everything,
skip-link, aria labels on icon buttons, focus visible. Images have alt text.
Lighthouse targets: Performance 90+, Accessibility 95+, on homepage and catalog.

## Never
Purple/blue gradients, gradient text, glow, neon, glass cards, emoji, "✨ New" badges,
uppercase tracked labels, hover:scale on cards, floating/bouncing loops, stock
illustrations, fake stats or reviews, more than 2 buttons in a hero.
