// One decorative composition, reusable on any .aurora-section with data-aurora.
export function setupAuroras() {
  const sections = [...document.querySelectorAll<HTMLElement>('[data-aurora]')];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = [...document.querySelectorAll<HTMLButtonElement>('[data-aurora-toggle]')];
  const visible = new Set<Element>();
  let paused = false;

  sections.forEach((section, index) => {
    const id = `aurora-${index}`;
    const layer = document.createElement('div');
    layer.className = 'aurora';
    layer.setAttribute('aria-hidden', 'true');
    // Local, unique gradient IDs allow several instances on the same page.
    layer.innerHTML = `<svg viewBox="0 0 1440 640" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <linearGradient id="${id}-color" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#26877f" stop-opacity="0" />
          <stop offset=".23" stop-color="#57dac4" />
          <stop offset=".48" stop-color="#548bdd" />
          <stop offset=".76" stop-color="#9c71e8" />
          <stop offset="1" stop-color="#6656bc" stop-opacity="0" />
        </linearGradient>
        <path id="${id}-a" d="M-220 460 C100 580 120 160 450 240 S930 640 1190 320 S1490 100 1660 180" />
        <path id="${id}-b" d="M-180 280 C100 420 290 80 580 210 S940 510 1190 410 S1490 140 1640 310" />
        <path id="${id}-c" d="M-160 550 C190 370 310 600 650 450 S1080 170 1280 280 S1520 570 1660 390" />
      </defs>
      ${['a', 'b', 'c'].map(name => `<g class="aurora-ribbon aurora-ribbon-${name}" fill="none" stroke="url(#${id}-color)">
        <use href="#${id}-${name}" class="aurora-haze" />
        <use href="#${id}-${name}" class="aurora-body" />
        <use href="#${id}-${name}" class="aurora-edge" />
      </g>`).join('')}
    </svg>`;
    section.prepend(layer);
  });

  function updateMotion() {
    sections.forEach(section => {
      section.classList.toggle('aurora-running', !paused && !preference.matches && !document.hidden && visible.has(section));
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
