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
              'aria-label="Open menu" aria-expanded="false" ' +
              'aria-controls="nav-mobile">' +
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
    const sheet = document.getElementById('nav-mobile');
    if (toggle && header && sheet) {
      function sheetItems() {
        return Array.prototype.slice.call(
          sheet.querySelectorAll('a[href], button:not([disabled])')
        );
      }

      function setMenu(open) {
        header.classList.toggle('is-open', open);
        document.body.classList.toggle('nav-locked', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        if (open) {
          const first = sheetItems()[0];
          if (first) {
            first.focus();
          }
        }
      }

      toggle.addEventListener('click', function () {
        setMenu(!header.classList.contains('is-open'));
      });

      sheet.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          setMenu(false);
        });
      });

      document.addEventListener('keydown', function (event) {
        if (!header.classList.contains('is-open')) {
          return;
        }
        if (event.key === 'Escape') {
          setMenu(false);
          toggle.focus();
          return;
        }
        if (event.key !== 'Tab') {
          return;
        }
        const items = [toggle].concat(sheetItems());
        if (!items.length) {
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });

      const desktopNav = window.matchMedia('(min-width: 768px)');
      function closeOnDesktop(event) {
        if (event.matches) {
          setMenu(false);
        }
      }
      if (desktopNav.addEventListener) {
        desktopNav.addEventListener('change', closeOnDesktop);
      }
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
