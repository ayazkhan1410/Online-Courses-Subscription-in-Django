(function () {
  function currentPath() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  function injectShell() {
    const shell = document.getElementById('app-shell');
    if (!shell) {
      return;
    }
    const path = currentPath();
    const title = document.body.dataset.pageTitle || 'Study with Ayaz';
    document.title = title;
    const user = window.API && API.getUser ? API.getUser() : null;

    shell.innerHTML =
      '<header class="site-header" id="site-header">' +
        '<div class="inner">' +
          '<a class="brand lesson-rule" href="/index.html">Study with Ayaz<span class="mark">.</span></a>' +
          '<ul class="nav-links" id="nav-links-desktop">' +
            '<li><a href="/index.html"' + (path === 'index.html' ? ' class="is-active"' : '') + '>Courses</a></li>' +
            (user
              ? '<li><a href="/dashboard.html"' + (path === 'dashboard.html' ? ' class="is-active"' : '') + '>Dashboard</a></li>'
              : '') +
            '<li><a href="/about.html"' + (path === 'about.html' ? ' class="is-active"' : '') + '>About</a></li>' +
            '<li><a href="/contact.html"' + (path === 'contact.html' ? ' class="is-active"' : '') + '>Contact</a></li>' +
          '</ul>' +
          '<div class="nav-spacer"></div>' +
          '<div class="nav-actions">' +
            '<button type="button" class="btn btn-ghost theme-toggle" id="theme-toggle" aria-label="Toggle theme">' +
              '<span class="theme-dot" aria-hidden="true"></span>' +
              '<span class="theme-label">Dark</span>' +
            '</button>' +
            '<span id="nav-auth"></span>' +
            '<span id="nav-pro"></span>' +
            '<form id="nav-search" role="search">' +
              '<input class="form-control" name="search" placeholder="Search" aria-label="Search">' +
              '<button class="btn btn-ghost" type="submit">Go</button>' +
            '</form>' +
            '<button type="button" class="nav-toggle" id="nav-toggle" aria-label="Open menu">' +
              '<span></span>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="nav-mobile" id="nav-mobile">' +
          '<ul class="nav-links">' +
            '<li><a href="/index.html">Courses</a></li>' +
            (user ? '<li><a href="/dashboard.html">Dashboard</a></li>' : '') +
            '<li><a href="/about.html">About</a></li>' +
            '<li><a href="/contact.html">Contact</a></li>' +
          '</ul>' +
        '</div>' +
      '</header>';

    const toggle = document.getElementById('nav-toggle');
    const header = document.getElementById('site-header');
    if (toggle && header) {
      toggle.addEventListener('click', function () {
        header.classList.toggle('is-open');
      });
    }
    if (window.Theme) {
      Theme.bind();
      Theme.apply(Theme.preferred());
    }
  }

  function boot() {
    injectShell();
    if (window.Nav && typeof window.Nav.mount === 'function') {
      window.Nav.mount();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
