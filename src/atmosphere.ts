// One decorative composition, reusable on any .atmosphere-section with data-atmosphere.
export function setupAtmospheres() {
  const sections = [...document.querySelectorAll<HTMLElement>('[data-atmosphere]')];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const visible = new Set<Element>();

  sections.forEach(section => {
    const layer = document.createElement('div');
    layer.className = 'atmosphere';
    layer.setAttribute('aria-hidden', 'true');
    // Overlapping light plumes rise above a steady horizon; texture stays static.
    for (const name of ['light', 'plume', 'plume-secondary', 'horizon', 'grain']) {
      const element = document.createElement('span');
      element.className = `atmosphere-${name}`;
      layer.append(element);
    }
    section.prepend(layer);
  });

  function updateMotion() {
    sections.forEach(section => {
      section.classList.toggle('atmosphere-running', !preference.matches && !document.hidden && visible.has(section));
    });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      updateMotion();
    });
    sections.forEach(section => observer.observe(section));
  }
  preference.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  updateMotion();
}
