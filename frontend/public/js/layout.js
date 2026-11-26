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
    const icon = window.Icons ? Icons.svg : function () { return ''; };

    shell.innerHTML =
      '<header class="site-header" id="site-header">' +
        '<div class="inner">' +
          '<a class="brand" href="/index.html">Study with Ayaz<span class="mark">.</span></a>' +
          '<ul class="nav-links" id="nav-links-desktop">' +
            '<li><a href="/index.html"' +
              (path === 'index.html' ? ' class="is-active"' : '') +
              '>Courses</a></li>' +
            (user
              ? '<li><a href="/dashboard.html"' +
                (path === 'dashboard.html' ? ' class="is-active"' : '') +
                '>Dashboard</a></li>'
              : '') +
            '<li><a href="/about.html"' +
              (path === 'about.html' ? ' class="is-active"' : '') +
              '>About</a></li>' +
            '<li><a href="/contact.html"' +
              (path === 'contact.html' ? ' class="is-active"' : '') +
              '>Contact</a></li>' +
            '<li><a href="/become-pro.html"' +
              (path === 'become-pro.html' || path === 'already-pro.html'
                ? ' class="is-active"'
                : '') +
              '>Pro</a></li>' +
          '</ul>' +
          '<div class="nav-spacer"></div>' +
          '<div class="nav-actions">' +
            '<button type="button" class="theme-toggle" id="theme-toggle" ' +
              'aria-label="Toggle theme">' +
              icon('moon') +
            '</button>' +
            '<span id="nav-auth"></span>' +
            '<button type="button" class="nav-toggle" id="nav-toggle" ' +
              'aria-label="Open menu">' +
              icon('menu') +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="nav-mobile" id="nav-mobile">' +
          '<ul class="nav-links">' +
            '<li><a href="/index.html">Courses</a></li>' +
            (user ? '<li><a href="/dashboard.html">Dashboard</a></li>' : '') +
            '<li><a href="/about.html">About</a></li>' +
            '<li><a href="/contact.html">Contact</a></li>' +
            '<li><a href="/become-pro.html">Pro</a></li>' +
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
