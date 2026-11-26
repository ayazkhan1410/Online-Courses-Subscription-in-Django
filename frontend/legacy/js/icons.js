(function (global) {
  function svg(name) {
    const paths = {
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
      moon: '<path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/>',
      menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/>',
      bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
      play: '<polygon points="6 3 20 12 6 21 6 3"/>',
      check: '<path d="M20 6 9 17l-5-5"/>',
      arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    };
    const body = paths[name] || '';
    return (
      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true">' +
      body +
      '</svg>'
    );
  }

  global.Icons = { svg: svg };
})(window);
