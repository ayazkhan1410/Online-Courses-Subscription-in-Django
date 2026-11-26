(function () {
  const KEY = 'swa_theme';

  function preferred() {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Direction is a study desk at night.
    return 'dark';
  }

  function apply(theme) {
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(KEY, next);
    const btn = document.getElementById('theme-toggle');
    if (!btn) {
      return;
    }
    btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
    btn.title = next === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    const icon = next === 'dark' ? 'sun' : 'moon';
    if (window.Icons) {
      btn.innerHTML = Icons.svg(icon);
    }
  }

  function toggle() {
    const current =
      document.documentElement.getAttribute('data-theme') || preferred();
    apply(current === 'dark' ? 'light' : 'dark');
  }

  function bind() {
    const btn = document.getElementById('theme-toggle');
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', toggle);
    }
  }

  apply(preferred());

  document.addEventListener('DOMContentLoaded', function () {
    apply(preferred());
    bind();
  });

  window.Theme = {
    apply: apply,
    toggle: toggle,
    bind: bind,
    preferred: preferred,
  };
})();
