// v2 mockup helpers: thumbnail cards, reveal-on-scroll, page switcher
window.tcard = (c, opts = {}) => `
  <a class="tcard${opts.cls ? ' ' + opts.cls : ''}" href="#">
    <div class="thumb"><img src="${c.img}" alt="">
      <span class="count">${c.n} lessons</span>
      ${opts.progress != null ? `<span class="prog"><i style="width:${opts.progress}%"></i></span>` : ''}
    </div>
    <div><h3>${c.t}</h3><div class="by">${c.by}</div></div>
    <div class="tags">${c.lang} · ${c.lvl}</div>
  </a>`;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-fill]').forEach((el) => {
    const list = window[el.dataset.fill] || [];
    const max = Number(el.dataset.max || list.length);
    el.innerHTML = list.slice(0, max).map((c, i) => tcard(c, { progress: el.dataset.progress && i === 0 ? 14 : null })).join('');
  });
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 })
    : null;
  document.querySelectorAll('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
  const here = location.pathname.split('/').pop();
  document.body.insertAdjacentHTML('beforeend', `<nav class="v2-bar" aria-label="Mockup directions">
    <a href="a.html"${here === 'a.html' ? ' aria-current="page"' : ''}>A · notebook</a>
    <a href="b.html"${here === 'b.html' ? ' aria-current="page"' : ''}>B · bold</a>
    <a href="home.html"${here === 'home.html' ? ' aria-current="page"' : ''}>final</a>
    <a href="../index.html">current</a></nav>`);
});
