import { productImages } from './content.ts';
import { connectMarketFeed, PRODUCTS } from './market-feed.ts';
import type { FeedSnapshot } from './market-feed.ts';

const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle')!;
const mobileMenu = document.querySelector<HTMLElement>('#mobile-navigation')!;

function setMenu(open: boolean) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  mobileMenu.hidden = !open;
}

menuButton.addEventListener('click', () => setMenu(mobileMenu.hidden));
mobileMenu.addEventListener('click', event => {
  if ((event.target as HTMLElement).closest('a')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileMenu.hidden) {
    setMenu(false);
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!mobileMenu.hidden && !(event.target as HTMLElement).closest('.site-header')) setMenu(false);
});
window.matchMedia('(min-width: 851px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});

for (const [slot, image] of Object.entries(productImages)) {
  if (!image.src) continue;
  const frame = document.querySelector<HTMLElement>(`[data-image-slot="${slot}"]`);
  if (!frame) continue;
  const img = new Image();
  img.alt = image.alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.addEventListener('load', () => frame.removeAttribute('aria-hidden'), { once: true });
  img.addEventListener('error', () => img.remove(), { once: true });
  img.src = image.src;
  frame.append(img);
}

const scenes = document.querySelectorAll<HTMLElement>('.motion-scene');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.classList.toggle('is-paused', !entry.isIntersecting);
  });
  scenes.forEach(scene => observer.observe(scene));
}

// First-view reveal: tag meaningful blocks, stagger siblings, show once on entry.
const revealSelector = [
  '.hero-content > *', '.market-strip-heading', '.market-quote', '.market-note',
  '.section-heading > *', '.section-topline', '.split-heading > *', '.depth-feature',
  '.depth-visual', '.data-section > .text-link', '.ai-copy > *', '.ai-visual',
  '.workflow-card', '.workflow-bottom > *', '.pricing-card', '.pricing-note',
  '.faq-heading > *', '.faq-list details', '.closing-section > *',
  '.platform-media', '.platform-caption', '.coverage-note',
  '.footer-main', '.footer-bottom',
].join(', ');
const revealElements = [...document.querySelectorAll<HTMLElement>(revealSelector)];
if (revealElements.length) {
  const scaleSelector = '.workflow-card, .pricing-card, .media-slot, .market-quote';
  const siblingCounts = new Map<Element | null, number>();
  for (const element of revealElements) {
    element.dataset.reveal = element.matches(scaleSelector) ? 'scale' : 'up';
    const count = (siblingCounts.get(element.parentElement) ?? 0) + 1;
    siblingCounts.set(element.parentElement, count);
    element.style.setProperty('--reveal-delay', `${Math.min((count - 1) * 90, 450)}ms`);
  }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    revealElements.forEach(element => element.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealElements.forEach(element => revealObserver.observe(element));
  }
}
const updateMotion = () => document.documentElement.classList.toggle('motion-paused', document.hidden);
document.addEventListener('visibilitychange', updateMotion);
updateMotion();

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const percentage = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' });
const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'UTC' });
const statusElement = document.querySelector<HTMLElement>('#feed-status')!;
const statusContainer = document.querySelector<HTMLElement>('.feed-status')!;
const updateElement = document.querySelector<HTMLElement>('#feed-updated')!;
const quoteElements = PRODUCTS.map(product => ({
  product,
  card: document.querySelector<HTMLElement>(`[data-product="${product}"]`)!,
}));

function renderFeed(snapshot: FeedSnapshot) {
  const statusLabels = { connecting: 'Connecting', live: 'Live', stale: 'Reconnecting · stale', unavailable: 'Feed unavailable' };
  const label = statusLabels[snapshot.status];
  // Only announce actual connection-state changes, never individual price ticks.
  if (statusElement.textContent !== label) statusElement.textContent = label;
  statusContainer.dataset.status = snapshot.status;
  if (snapshot.updatedAt !== null) {
    updateElement.textContent = `${snapshot.status === 'live' ? 'Updated' : 'Last received'} ${time.format(snapshot.updatedAt)} UTC`;
  } else {
    updateElement.textContent = snapshot.status === 'unavailable' ? 'Retrying automatically' : 'Waiting for market data';
  }
  for (const { product, card } of quoteElements) {
    const quote = snapshot.quotes[product];
    if (!quote) continue;
    card.querySelector<HTMLElement>('.quote-price')!.textContent = currency.format(quote.price);
    card.querySelector<HTMLElement>('[data-change]')!.textContent = `${percentage.format(quote.changePercent)}%`;
    const changeElement = card.querySelector<HTMLElement>('.quote-change')!;
    changeElement.classList.toggle('positive', quote.changePercent > 0);
    changeElement.classList.toggle('negative', quote.changePercent < 0);
  }
}

let disconnect = connectMarketFeed(renderFeed);
window.addEventListener('pagehide', () => disconnect());
window.addEventListener('pageshow', event => {
  if (event.persisted) disconnect = connectMarketFeed(renderFeed);
});

document.querySelector('#copyright-year')!.textContent = String(new Date().getFullYear());
