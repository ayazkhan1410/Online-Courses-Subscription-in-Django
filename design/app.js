// Mockup helpers: theme, lucide icons, shared nav/footer. In React these become components.
(function () {
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  root.dataset.theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  // lucide paths (stroke 1.5, 24 viewBox)
  const P = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "arrow-right": '<path d="M5 12h14M12 5l7 7-7 7"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    server: '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 6h.01M6 18h.01"/>',
    layout: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>',
    terminal: '<path d="m4 17 6-6-6-6M12 19h8"/>',
    cpu: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    branch: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9a9 9 0 0 1-9 9M6 9v6"/>',
    briefcase: '<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    pen: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    filter: '<path d="M3 6h18M7 12h10M10 18h4"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    note: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 5L2 7"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  };
  const svg = (name, cls = "") =>
    `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ""}</svg>`;
  window.icon = svg;

  const LOGO = `<svg class="logo-mark" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3.5" y="2.5" width="17" height="19" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <path d="M7.5 2.5v19" stroke="currentColor" stroke-width="1.5"/>
    <path d="M11 8h6M11 12h6" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/></svg>`;

  function nav(current) {
    const links = [["courses.html", "Courses"], ["courses.html#categories", "Categories"], ["#", "Paths"], ["#", "Services"], ["#", "About"]];
    return `<header class="nav"><div class="wrap nav-in">
      <a class="logo" href="index.html">${LOGO}Study with Ayaz</a>
      <nav class="nav-links" aria-label="Main">${links
        .map(([h, t]) => `<a href="${h}"${t === current ? ' aria-current="page"' : ""}>${t}</a>`)
        .join("")}</nav>
      <div class="nav-end">
        <button class="btn btn-ghost btn-icon theme-toggle" aria-label="Switch theme">${svg("sun", "i-sun")}${svg("moon", "i-moon")}</button>
        <a class="nav-login" href="auth.html">Log in</a>
        <a class="btn btn-primary btn-sm" href="auth.html">Start learning</a>
        <button class="btn btn-ghost btn-icon nav-menu" aria-label="Open menu">${svg("menu")}</button>
      </div></div></header>`;
  }

  function footer() {
    return `<footer class="footer"><div class="wrap">
      <div class="footer-grid">
        <div><a class="logo" href="index.html">${LOGO}Study with Ayaz</a>
          <p class="dim small" style="max-width:320px;margin:12px 0 0">Free programming courses from YouTube, put in order and tracked lesson by lesson. Curated by Ayaz Khan.</p></div>
        <div><h4>Learn</h4><ul><li><a href="courses.html">All courses</a></li><li><a href="courses.html#categories">Categories</a></li><li><a href="#">Paths</a></li></ul></div>
        <div><h4>Work with me</h4><ul><li><a href="#">Services</a></li><li><a href="#">Projects</a></li><li><a href="#">Contact</a></li></ul></div>
        <div><h4>Site</h4><ul><li><a href="#">About</a></li><li><a href="#">FAQ</a></li><li><a href="#">Terms</a></li><li><a href="#">Privacy</a></li></ul></div>
      </div>
      <div class="footer-note small muted"><span>Videos belong to their creators and play from YouTube.</span><span class="mono">© 2026</span></div>
    </div></footer>`;
  }

  function mockBar(current) {
    const pages = [["index.html", "Home"], ["courses.html", "Courses"], ["course.html", "Course"], ["learn.html", "Learn"], ["dashboard.html", "Dashboard"], ["auth.html", "Auth"]];
    return `<nav class="mock-bar" aria-label="Mockup pages">${pages
      .map(([h, t]) => `<a href="${h}"${location.pathname.endsWith(h) ? ' aria-current="page"' : ""}>${t}</a>`)
      .join("")}</nav>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-icon]").forEach((el) => {
      el.outerHTML = svg(el.dataset.icon, el.className);
    });
    const n = document.querySelector("[data-nav]");
    if (n) n.outerHTML = nav(n.dataset.nav);
    const f = document.querySelector("[data-footer]");
    if (f) f.outerHTML = footer();
    document.body.insertAdjacentHTML("beforeend", mockBar());
    document.querySelectorAll("[data-ticks]").forEach((el) => {
      const [done, total] = el.dataset.ticks.split("/").map(Number);
      el.style.setProperty("--n", total);
      el.innerHTML = Array.from({ length: total }, (_, k) =>
        `<i class="${k < done ? "on" : k === done ? "now" : ""}"></i>`).join("");
    });
    document.addEventListener("click", (e) => {
      if (e.target.closest(".theme-toggle")) {
        root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
        try { localStorage.setItem("theme", root.dataset.theme); } catch (err) {}
      }
      const chip = e.target.closest("[data-single] [aria-pressed]");
      if (chip) {
        chip.parentElement.querySelectorAll("[aria-pressed]").forEach((c) => c.setAttribute("aria-pressed", "false"));
        chip.setAttribute("aria-pressed", "true");
      }
    });
  });
})();
