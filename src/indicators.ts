import { premiumIndicators } from './content.ts';

export function setupIndicators() {
  const track = document.querySelector<HTMLElement>('#indicator-track')!;
  const list = document.querySelector<HTMLUListElement>('#indicator-list')!;
  const previous = document.querySelector<HTMLButtonElement>('#indicator-previous')!;
  const next = document.querySelector<HTMLButtonElement>('#indicator-next')!;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const number = new Intl.NumberFormat('en-US');

  for (const indicator of premiumIndicators) {
    const item = document.createElement('li');
    item.className = 'indicator-item';
    item.innerHTML = `
      <article class="indicator-card">
        <div class="indicator-image" aria-hidden="true"></div>
        <div class="indicator-body">
          <h3></h3>
          <p class="indicator-description"></p>
          <div class="indicator-card-footer">
            <span class="indicator-users" role="img">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="7" r="3"/>
                <path d="M3 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 4a3 3 0 0 1 0 6m2 4a4 4 0 0 1 3 4v2"/>
              </svg>
              <span></span>
            </span>
            <button class="indicator-detail" type="button" aria-disabled="true">View indicator</button>
          </div>
        </div>
      </article>`;
    const title = item.querySelector('h3')!;
    title.id = `indicator-${indicator.id}`;
    title.textContent = indicator.name;
    item.querySelector('article')!.setAttribute('aria-labelledby', title.id);
    item.querySelector('.indicator-description')!.textContent = indicator.description;
    const users = item.querySelector<HTMLElement>('.indicator-users')!;
    const { userCount } = indicator;
    const countText = userCount === null ? '—' : number.format(userCount);
    const countLabel = userCount === null
      ? 'User count unavailable'
      : `${countText} ${userCount === 1 ? 'user' : 'users'} using this indicator`;
    users.title = countLabel;
    users.setAttribute('aria-label', countLabel);
    users.querySelector('span')!.textContent = countText;
    item.querySelector('button')!.setAttribute('aria-label', `View ${indicator.name} (coming soon)`);

    if (indicator.image.src) {
      const frame = item.querySelector<HTMLElement>('.indicator-image')!;
      const image = new Image();
      image.alt = indicator.image.alt;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('load', () => frame.removeAttribute('aria-hidden'), { once: true });
      image.addEventListener('error', () => image.remove(), { once: true });
      image.src = indicator.image.src;
      frame.append(image);
    }
    list.append(item);
  }

  const cards = [...list.children] as HTMLElement[];
  list.style.setProperty('--indicator-count', String(Math.max(1, cards.length)));
  let stops = measureStops();
  let targetOffset: number | null = null;
  let drag: { pointerId: number; startX: number; startY: number; index: number; active: boolean } | null = null;

  function measureStops() {
    const maxOffset = track.scrollWidth - track.clientWidth;
    const listLeft = list.getBoundingClientRect().left;
    const offsets = [0];
    for (const card of cards.slice(1)) {
      if (offsets[offsets.length - 1] >= maxOffset - 1) break;
      offsets.push(Math.min(maxOffset, card.getBoundingClientRect().left - listLeft));
    }
    return offsets;
  }

  function nearestStop(offset: number) {
    return stops.reduce((nearest, stop, index) =>
      Math.abs(stop - offset) < Math.abs(stops[nearest] - offset) ? index : nearest, 0);
  }

  function updateNavigation() {
    const offset = targetOffset ?? track.scrollLeft;
    previous.disabled = offset <= 1;
    next.disabled = offset >= stops[stops.length - 1] - 1;
  }

  function scrollToIndex(index: number) {
    const offset = stops[Math.max(0, Math.min(index, stops.length - 1))];
    targetOffset = offset;
    track.scrollTo({ left: offset, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    updateNavigation();
  }

  function move(direction: number) {
    scrollToIndex(nearestStop(targetOffset ?? track.scrollLeft) + direction);
  }

  function syncNavigation() {
    targetOffset = null;
    updateNavigation();
  }

  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', event => {
    if (event.target !== track) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      scrollToIndex(event.key === 'Home' ? 0 : stops.length - 1);
    }
  });

  track.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || stops.length < 2) return;
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      index: nearestStop(track.scrollLeft),
      active: false,
    };
  });

  track.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const distance = drag.startX - event.clientX;
    if (!drag.active) {
      if (Math.abs(distance) < 8 || Math.abs(distance) <= Math.abs(event.clientY - drag.startY)) return;
      drag.active = true;
      track.setPointerCapture(event.pointerId);
      track.classList.add('is-dragging');
      syncNavigation();
    }
    const previousStop = stops[Math.max(0, drag.index - 1)];
    const nextStop = stops[Math.min(stops.length - 1, drag.index + 1)];
    track.scrollLeft = Math.max(previousStop, Math.min(nextStop, stops[drag.index] + distance));
  });

  function finishDrag(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const { active, index, startX } = drag;
    drag = null;
    if (!active) return;
    const distance = startX - event.clientX;
    const advance = event.type === 'pointerup' && Math.abs(distance) >= Math.min(72, stops[1] / 4);
    track.classList.remove('is-dragging');
    scrollToIndex(index + (advance ? Math.sign(distance) : 0));
  }

  track.addEventListener('pointerup', finishDrag);
  track.addEventListener('pointercancel', finishDrag);
  track.addEventListener('pointerleave', event => {
    if (drag && !drag.active) finishDrag(event);
  });
  track.addEventListener('lostpointercapture', event => {
    if (event.target === track) finishDrag(event);
  });

  let lastWheelTime = -Infinity;
  let wheelDistance = 0;
  let wheelAdvanced = false;
  track.addEventListener('wheel', event => {
    const threshold = event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? 36 : 1;
    const delta = event.deltaX || (event.shiftKey ? event.deltaY : 0);
    if (event.ctrlKey || !delta || stops.length < 2) return;
    if (!event.shiftKey && Math.abs(delta) <= Math.abs(event.deltaY)) return;
    event.preventDefault();

    // Group trackpad deltas and their momentum into a single step.
    if (event.timeStamp - lastWheelTime > 150) {
      wheelDistance = 0;
      wheelAdvanced = false;
    }
    lastWheelTime = event.timeStamp;
    if (wheelAdvanced || drag?.active) return;
    wheelDistance += delta;
    if (Math.abs(wheelDistance) < threshold) return;
    wheelAdvanced = true;
    move(Math.sign(wheelDistance));
  }, { passive: false });

  let frame = 0;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (targetOffset !== null && Math.abs(track.scrollLeft - targetOffset) <= 1) targetOffset = null;
      updateNavigation();
    });
  }, { passive: true });
  track.addEventListener('scrollend', syncNavigation);
  new ResizeObserver(() => {
    stops = measureStops();
    if (drag) {
      drag = null;
      track.classList.remove('is-dragging');
    }
    syncNavigation();
  }).observe(track);
  updateNavigation();
}
