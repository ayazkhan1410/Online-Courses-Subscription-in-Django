(function () {
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initReveal() {
    const nodes = document.querySelectorAll('.reveal');
    if (!nodes.length) {
      return;
    }
    if (prefersReducedMotion()) {
      nodes.forEach(function (node) {
        node.classList.add('is-in');
      });
      return;
    }
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    );
    nodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  function boot() {
    initReveal();
  }

  document.addEventListener('DOMContentLoaded', boot);

  window.Motion = {
    initReveal: initReveal,
    boot: boot,
  };
})();
