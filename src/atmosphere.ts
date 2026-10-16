// One decorative composition, reusable on any .atmosphere-section with data-atmosphere.
export function setupAtmospheres() {
  const sections = [...document.querySelectorAll<HTMLElement>('[data-atmosphere]')];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = [...document.querySelectorAll<HTMLButtonElement>('[data-atmosphere-toggle]')];
  const visible = new Set<Element>();
  let paused = false;

  sections.forEach(section => {
    const layer = document.createElement('div');
    layer.className = 'atmosphere';
    layer.setAttribute('aria-hidden', 'true');
    // A diffused spotlight above a dark horizon, with a fine static texture.
    for (const name of ['light', 'horizon', 'grain']) {
      const element = document.createElement('span');
      element.className = `atmosphere-${name}`;
      layer.append(element);
    }
    section.prepend(layer);
  });

  function updateMotion() {
    sections.forEach(section => {
      section.classList.toggle('atmosphere-running', !paused && !preference.matches && !document.hidden && visible.has(section));
    });
    controls.forEach(control => {
      control.hidden = preference.matches;
      control.setAttribute('aria-pressed', String(paused));
      control.setAttribute('aria-label', paused ? 'Resume background animation' : 'Pause background animation');
      control.textContent = paused ? 'Resume motion' : 'Pause motion';
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
  controls.forEach(control => control.addEventListener('click', () => {
    paused = !paused;
    updateMotion();
  }));
  preference.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  updateMotion();
}
