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
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    nodes.forEach(function (node, index) {
      node.style.transitionDelay = Math.min(index, 6) * 50 + 'ms';
      observer.observe(node);
    });
  }

  function initCardTilt() {
    if (prefersReducedMotion()) {
      return;
    }
    if (window.matchMedia('(hover: none)').matches) {
      return;
    }
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      if (card.dataset.tiltBound) {
        return;
      }
      card.dataset.tiltBound = '1';
      card.addEventListener('pointermove', function (event) {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          'translateY(-8px) rotateX(' +
          (-y * 5).toFixed(2) +
          'deg) rotateY(' +
          (x * 6).toFixed(2) +
          'deg)';
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });
  }

  function initHeroParallax() {
    if (prefersReducedMotion()) {
      return;
    }
    if (window.matchMedia('(hover: none)').matches) {
      return;
    }
    const stage = document.querySelector('[data-parallax-stage]');
    if (!stage || stage.dataset.parallaxBound) {
      return;
    }
    stage.dataset.parallaxBound = '1';
    const layers = stage.querySelectorAll('[data-depth]');
    stage.addEventListener('pointermove', function (event) {
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      layers.forEach(function (layer) {
        const depth = parseFloat(layer.getAttribute('data-depth') || '20');
        const tx = (x * depth * 0.35).toFixed(2);
        const ty = (y * depth * 0.28).toFixed(2);
        const base = layer.style.getPropertyValue('--base-transform') || '';
        layer.style.transform =
          (base ? base + ' ' : '') +
          'translate3d(' + tx + 'px, ' + ty + 'px, 0)';
      });
    });
    stage.addEventListener('pointerleave', function () {
      layers.forEach(function (layer) {
        layer.style.transform = layer.style.getPropertyValue('--base-transform') || '';
      });
    });
  }

  function boot() {
    initReveal();
    initCardTilt();
    initHeroParallax();
  }

  document.addEventListener('DOMContentLoaded', boot);

  window.Motion = {
    initReveal: initReveal,
    initCardTilt: initCardTilt,
    initHeroParallax: initHeroParallax,
    boot: boot,
  };
})();
