import type { PremiumIndicator } from './content.ts';

export function createIndicatorCard(indicator: PremiumIndicator, heading: 'h2' | 'h3') {
  const item = document.createElement('li');
  item.className = 'indicator-item';
  item.innerHTML = `
    <article class="indicator-card">
      <div class="indicator-body">
        <${heading} class="indicator-card-title"></${heading}>
        <ul class="indicator-tags" aria-label="Indicator tags" role="list"></ul>
        <p class="indicator-description"></p>
        <div class="indicator-card-footer">
          <span class="indicator-author">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="7" r="3"/>
              <path d="M5 20v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/>
            </svg>
            <span></span>
          </span>
        </div>
      </div>
    </article>`;

  const card = item.querySelector('article')!;
  const title = card.querySelector(heading)!;
  title.id = `indicator-${indicator.id}`;
  title.textContent = indicator.name;
  card.setAttribute('aria-labelledby', title.id);
  card.querySelector('.indicator-description')!.textContent = indicator.description;
  card.querySelector('.indicator-author span')!.textContent = indicator.author;

  const tagList = card.querySelector('.indicator-tags')!;
  for (const label of indicator.tags) {
    const tag = document.createElement('li');
    tag.className = 'indicator-tag';
    tag.dataset.tag = label;
    tag.textContent = label;
    tagList.append(tag);
  }

  return item;
}
