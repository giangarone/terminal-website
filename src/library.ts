import { premiumIndicators, type PremiumIndicator } from './content.ts';
import { createIndicatorCard } from './indicator-card.ts';
import { setupSiteNavigation } from './site-navigation.ts';

setupSiteNavigation();

const searchForm = document.querySelector<HTMLFormElement>('#library-search-form')!;
const searchInput = document.querySelector<HTMLInputElement>('#library-search')!;
const filterGroup = document.querySelector<HTMLElement>('#library-filters')!;
const results = document.querySelector<HTMLUListElement>('#library-results')!;
const count = document.querySelector<HTMLElement>('#library-count')!;
const emptyState = document.querySelector<HTMLElement>('#library-empty')!;
const resetButton = document.querySelector<HTMLButtonElement>('#library-reset')!;
const pagination = document.querySelector<HTMLElement>('#library-pagination')!;
const showMore = document.querySelector<HTMLButtonElement>('#library-more')!;

const pageSize = 30;
let visibleLimit = pageSize;
let activeTag: PremiumIndicator['tags'][number] | null = null;

const searchableIndicators = premiumIndicators.map(indicator => ({
  indicator,
  searchText: [indicator.name, indicator.author, indicator.description, ...indicator.tags].join(' ').toLowerCase(),
}));

const tags = [...new Set(premiumIndicators.flatMap(indicator => indicator.tags))].sort();
const filters = [null, ...tags].map(tag => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'indicator-tag library-filter';
  button.textContent = tag ?? 'All';
  if (tag) button.dataset.tag = tag;
  else button.setAttribute('aria-label', 'All indicators');
  button.addEventListener('click', () => {
    activeTag = tag;
    resetResults();
  });
  filterGroup.append(button);
  return { button, tag };
});

function renderResults() {
  const words = searchInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = searchableIndicators.filter(({ indicator, searchText }) =>
    (activeTag === null || indicator.tags.includes(activeTag)) && words.every(word => searchText.includes(word)),
  );
  const shown = matches.slice(0, visibleLimit);
  const hasMore = shown.length < matches.length;
  const resultLabel = matches.length === 1 ? 'indicator' : 'indicators';

  results.replaceChildren(...shown.map(({ indicator }) => createIndicatorCard(indicator, 'h2')));
  for (const { button, tag } of filters) {
    button.setAttribute('aria-pressed', String(tag === activeTag));
  }

  if (matches.length === 0) {
    count.textContent = 'No matching indicators';
  } else {
    count.textContent = hasMore
      ? `Showing ${shown.length} of ${matches.length} ${resultLabel}`
      : `${matches.length} ${resultLabel}`;
  }

  emptyState.hidden = matches.length > 0;
  pagination.hidden = !hasMore;
}

function resetResults() {
  visibleLimit = pageSize;
  renderResults();
}

searchForm.addEventListener('submit', event => event.preventDefault());
searchInput.addEventListener('input', resetResults);
resetButton.addEventListener('click', () => {
  searchInput.value = '';
  activeTag = null;
  resetResults();
  searchInput.focus();
});
showMore.addEventListener('click', () => {
  const firstNewCardIndex = results.children.length;
  visibleLimit += pageSize;
  renderResults();
  const title = results.children[firstNewCardIndex]?.querySelector('h2');
  if (title) {
    title.tabIndex = -1;
    title.focus();
  }
});

renderResults();
document.querySelector<HTMLElement>('#library-controls')!.hidden = false;
