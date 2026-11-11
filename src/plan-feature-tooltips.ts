export function initPlanFeatureTooltips() {
  let active: HTMLElement | null = null;
  let pinned = false;
  let entranceAnimation: Animation | undefined;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');

  // Render outside the cards so their animations and stacking never clip the tip.
  const tooltip = document.createElement('div');
  tooltip.id = 'plan-feature-tooltip';
  tooltip.className = 'plan-feature-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  const title = document.createElement('strong');
  title.className = 'plan-feature-tooltip-title';
  const description = document.createElement('p');
  description.className = 'plan-feature-description';
  tooltip.append(title, description);
  document.body.append(tooltip);

  function close() {
    entranceAnimation?.cancel();
    active?.removeAttribute('data-tooltip-open');
    active?.querySelector('button')?.removeAttribute('aria-describedby');
    active = null;
    pinned = false;
    tooltip.hidden = true;
  }

  function position() {
    if (!active) return;
    const bounds = active.getBoundingClientRect();
    const heading = active.querySelector('h4')!.getBoundingClientRect();
    const container = active.closest('.plan-features')!.getBoundingClientRect();
    const featureStyle = getComputedStyle(active);
    tooltip.style.fontSize = featureStyle.fontSize;
    tooltip.style.width = `${container.width}px`;
    tooltip.style.left = `${container.left}px`;
    const tip = tooltip.getBoundingClientRect();
    const margin = 12;
    const gap = 10;
    const above = heading.top - tip.height - gap;
    const top = above >= margin ? above : bounds.bottom + gap;
    tooltip.style.top = `${Math.max(margin, Math.min(top, innerHeight - tip.height - margin))}px`;
  }

  function show(feature: HTMLElement) {
    const entering = active !== feature;
    if (entering) close();
    active = feature;
    tooltip.classList.toggle('is-featured', feature.closest('.featured-plan') !== null);
    title.textContent = feature.querySelector('h4')!.textContent!.replace(/\s+/g, ' ').trim();
    description.textContent = feature.dataset.featureDetail!;
    feature.setAttribute('data-tooltip-open', '');
    feature.querySelector('button')!.setAttribute('aria-describedby', tooltip.id);
    tooltip.hidden = false;
    position();
    if (entering && !motion.matches) {
      entranceAnimation = tooltip.animate([
        { opacity: 0, transform: 'translateY(4px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 160, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }
  }

  for (const feature of document.querySelectorAll<HTMLElement>('.plan-feature[data-feature-detail]')) {
    const heading = feature.querySelector<HTMLElement>('.plan-feature-heading');
    if (!heading) continue;
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'plan-feature-trigger';
    trigger.append(...heading.childNodes);
    heading.append(trigger);
    feature.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') show(feature);
    });
    feature.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'touch' && active === feature && !trigger.matches(':focus-visible')) close();
    });
    trigger.addEventListener('focus', () => show(feature));
    trigger.addEventListener('blur', close);
    feature.addEventListener('click', () => {
      if (active === feature && pinned) close();
      else {
        show(feature);
        pinned = true;
      }
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
  });
  document.addEventListener('click', event => {
    if (active && event.target instanceof Node && !active.contains(event.target) && !tooltip.contains(event.target)) close();
  });
  window.addEventListener('resize', position);
  motion.addEventListener('change', () => {
    if (motion.matches) entranceAnimation?.cancel();
  });
  window.addEventListener('scroll', () => {
    if (!active) return;
    const bounds = active.getBoundingClientRect();
    // Keep keyboard-triggered tips attached during the browser's focus scroll.
    if (bounds.bottom <= 0 || bounds.top >= innerHeight) close();
    else position();
  }, { passive: true, capture: true });
}
