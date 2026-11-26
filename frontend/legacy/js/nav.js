(function () {
  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function renderNav() {
    const user = API.getUser();
    const authSlot = document.getElementById('nav-auth');
    if (!authSlot) {
      return;
    }

    if (!user) {
      // Text link + one button.
      authSlot.innerHTML =
        '<a href="/login.html" class="btn-link-quiet">Log in</a>' +
        '<a href="/register.html" class="btn btn-swa">Join</a>';
      return;
    }

    if (user.is_pro) {
      authSlot.innerHTML =
        '<button type="button" id="logout-btn" class="btn-link-quiet">Log out</button>';
    } else {
      authSlot.innerHTML =
        '<button type="button" id="logout-btn" class="btn-link-quiet">Log out</button>' +
        '<a href="/become-pro.html" class="btn btn-accent">Go Pro</a>';
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function () {
        try {
          await API.logout();
        } catch (err) {
          // Session may already be gone.
        }
        API.clearSession();
        window.location.href = '/index.html';
      });
    }
  }

  function mount() {
    renderNav();
  }

  document.addEventListener('DOMContentLoaded', function () {
    requestAnimationFrame(mount);
  });

  window.Nav = { qs: qs, renderNav: renderNav, mount: mount };
})();
