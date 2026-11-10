export function initHeroStats() {
  const group = document.querySelector<HTMLElement>('.hero-stats');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!group || motion.matches || !('IntersectionObserver' in window)) return;

  const counters = [...group.querySelectorAll<HTMLElement>('[data-count-to]')].flatMap(element => {
    const target = Number(element.dataset.countTo);
    const text = element.firstChild;
    if (!(text instanceof Text) || !Number.isFinite(target) || target <= 0) return [];
    const decimals = Number.isInteger(target) ? 0 : 1;
    const formatter = new Intl.NumberFormat('en', {
      notation: target >= 1000 ? 'compact' : 'standard',
      minimumFractionDigits: decimals,
      maximumFractionDigits: target >= 1000 ? 1 : decimals,
    });
    return [{ text, target, formatter, finalText: text.data }];
  });
  if (!counters.length) return;

  let frame = 0;
  let started = false;
  let startedAt = 0;
  const duration = 1600;
  // Match the existing hero group's entrance stagger before counting visibly.
  const delay = 225;

  function finish() {
    cancelAnimationFrame(frame);
    observer.disconnect();
    counters.forEach(counter => { counter.text.data = counter.finalText; });
    motion.removeEventListener('change', onMotionChange);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }

  function tick(now: number) {
    const progress = Math.min(1, Math.max(0, (now - startedAt - delay) / duration));
    if (progress === 1) {
      finish();
      return;
    }
    const eased = 1 - (1 - progress) ** 3;
    for (const counter of counters) {
      // Round down so the final value arrives only when the animation lands.
      const precision = Number.isInteger(counter.target) ? 1 : 10;
      const value = Math.floor(counter.target * eased * precision) / precision;
      counter.text.data = counter.formatter.format(value);
    }
    frame = requestAnimationFrame(tick);
  }

  function onMotionChange() {
    if (motion.matches) finish();
  }

  function onVisibilityChange() {
    if (document.hidden && started) finish();
  }

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting) || started) return;
    if (document.hidden || motion.matches) {
      finish();
      return;
    }
    started = true;
    observer.disconnect();
    startedAt = performance.now();
    counters.forEach(counter => { counter.text.data = counter.formatter.format(0); });
    frame = requestAnimationFrame(tick);
  }, { threshold: 0.35 });

  motion.addEventListener('change', onMotionChange);
  document.addEventListener('visibilitychange', onVisibilityChange);
  observer.observe(group);
}
