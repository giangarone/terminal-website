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

  function updateNavigation() {
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    track.classList.toggle('can-scroll-left', !previous.disabled);
    track.classList.toggle('can-scroll-right', !next.disabled);
  }

  function move(direction: number) {
    const stride = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
    const pageSize = Math.max(1, Math.floor(track.clientWidth / stride));
    track.scrollBy({ left: direction * stride * pageSize, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
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
      track.scrollTo({ left: event.key === 'Home' ? 0 : track.scrollWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    }
  });
  let frame = 0;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(updateNavigation);
  }, { passive: true });
  new ResizeObserver(updateNavigation).observe(track);
  updateNavigation();
}
