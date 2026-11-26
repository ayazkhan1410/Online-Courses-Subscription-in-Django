(function () {
  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function renderNav() {
    const user = API.getUser();
    const authSlot = document.getElementById('nav-auth');
    const proSlot = document.getElementById('nav-pro');
    if (!authSlot || !proSlot) {
      return;
    }

    if (!user) {
      authSlot.innerHTML =
        '<a href="/login.html" class="btn btn-ghost">Log in</a>' +
        '<a href="/register.html" class="btn btn-swa">Join</a>';
      proSlot.innerHTML =
        '<a href="/become-pro.html" class="btn btn-ghost">' +
        '<span class="btn-pro-label">Go Pro</span></a>';
      return;
    }

    authSlot.innerHTML =
      '<button type="button" id="logout-btn" class="btn btn-ghost">Log out</button>';
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function () {
        try {
          await API.logout();
        } catch (err) {
          // Token may already be invalid; clear local session anyway.
        }
        API.clearSession();
        window.location.href = '/index.html';
      });
    }

    if (user.is_pro) {
      proSlot.innerHTML =
        '<a href="/already-pro.html" class="btn btn-ghost">Pro</a>';
    } else {
      proSlot.innerHTML =
        '<a href="/become-pro.html" class="btn btn-accent">Go Pro</a>';
    }
  }

  function wireSearch() {
    const form = document.getElementById('nav-search');
    if (!form) {
      return;
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const input = form.querySelector('input[name="search"]');
      const value = (input && input.value) || '';
      const url = new URL('/index.html', window.location.origin);
      if (value.trim()) {
        url.searchParams.set('search', value.trim());
      }
      url.hash = 'catalog';
      window.location.href = url.toString();
    });
    const existing = qs('search');
    const input = form.querySelector('input[name="search"]');
    if (existing && input && window.location.pathname.endsWith('index.html')) {
      input.value = existing;
    }

    const mobile = document.getElementById('nav-mobile');
    if (mobile && window.matchMedia('(max-width: 900px)').matches) {
      if (!document.getElementById('nav-search-mobile')) {
        const clone = form.cloneNode(true);
        clone.id = 'nav-search-mobile';
        mobile.appendChild(clone);
        clone.addEventListener('submit', function (event) {
          event.preventDefault();
          const value =
            (clone.querySelector('input[name="search"]') || {}).value || '';
          const url = new URL('/index.html', window.location.origin);
          if (value.trim()) {
            url.searchParams.set('search', value.trim());
          }
          url.hash = 'catalog';
          window.location.href = url.toString();
        });
      }
    }
  }

  function mount() {
    renderNav();
    wireSearch();
  }

  document.addEventListener('DOMContentLoaded', function () {
    // layout.js injects shell on the same tick; wait one frame.
    requestAnimationFrame(mount);
  });

  window.Nav = { qs: qs, renderNav: renderNav, mount: mount };
})();
