(function (global) {
  const EMOJI_RE =
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu;

  function stripEmoji(value) {
    return String(value || '')
      .replace(EMOJI_RE, '')
      .replace(/!+/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return stripEmoji((div.textContent || div.innerText || '').trim());
  }

  function dayLabel(index, total) {
    const n = Math.max(1, (index || 0) + 1);
    const t = Math.max(n, total || 0);
    return (
      'Day ' +
      String(n).padStart(2, '0') +
      ' / ' +
      String(t).padStart(2, '0')
    );
  }

  global.TextUtil = {
    stripEmoji: stripEmoji,
    stripHtml: stripHtml,
    dayLabel: dayLabel,
  };
})(window);
