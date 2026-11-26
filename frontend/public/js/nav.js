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
        '<a href="/login.html" class="btn btn-primary mx-2">Login</a>' +
        '<a href="/register.html" class="btn btn-secondary">Register</a>';
      proSlot.innerHTML =
        '<a href="/become-pro.html" class="btn btn-danger mx-2">Become Pro</a>';
      return;
    }

    authSlot.innerHTML =
      '<button type="button" id="logout-btn" class="btn btn-success mx-3">' +
      'Logout</button>';
    document.getElementById('logout-btn').addEventListener('click', async function () {
      try {
        await API.logout();
      } catch (err) {
        // Token may already be invalid; clear local session anyway.
      }
      API.clearSession();
      window.location.href = '/index.html';
    });

    if (user.is_pro) {
      proSlot.innerHTML =
        '<a href="/already-pro.html" class="btn btn-primary mx-2">Pro Soldier</a>';
    } else {
      proSlot.innerHTML =
        '<a href="/become-pro.html" class="btn btn-danger mx-2">Become Pro</a>';
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
      window.location.href = url.toString();
    });
    const existing = qs('search');
    const input = form.querySelector('input[name="search"]');
    if (existing && input && window.location.pathname.endsWith('index.html')) {
      input.value = existing;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderNav();
    wireSearch();
  });

  window.Nav = { qs: qs, renderNav: renderNav };
})();
