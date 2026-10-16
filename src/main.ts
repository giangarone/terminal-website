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

// Reveal complete content groups, with a short stagger only for adjacent
// items entering together. Default HTML stays readable without JavaScript.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const entranceAnimations = new Map<Element, Animation>();
const entranceElements = [...document.querySelectorAll<HTMLElement>([
  '.hero-content > *', '.market-strip-heading', '.market-quotes', '.market-note',
  '.section-heading', '.section-topline', '.split-heading', '.coverage-card',
  '.platform-media', '.platform-caption', '.depth-feature', '.depth-visual',
  '.data-section > .text-link', '.ai-copy > *', '.ai-visual',
  '.workflow-card', '.workflow-bottom', '.pricing-card', '.pricing-note',
  '.faq-heading', '.faq-list details', '.closing-section > *',
  '.footer-main',
].join(', '))];
let entranceObserver: IntersectionObserver | undefined;

function showImmediately(element: Element) {
  entranceObserver?.unobserve(element);
  element.removeAttribute('data-entrance-pending');
  entranceAnimations.get(element)?.cancel();
  entranceAnimations.delete(element);
}

if (!motionPreference.matches && 'IntersectionObserver' in window && 'animate' in Element.prototype) {
  entranceObserver = new IntersectionObserver(entries => {
    const siblingCounts = new Map<Element | null, number>();
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      entranceObserver!.unobserve(element);
      if (motionPreference.matches || document.hidden) {
        showImmediately(element);
        continue;
      }
      const index = siblingCounts.get(element.parentElement) ?? 0;
      siblingCounts.set(element.parentElement, index + 1);
      const isVisual = element.matches('.platform-media, .depth-visual, .ai-visual');
      const animation = element.animate([
        { opacity: 0, transform: `translateY(${isVisual ? 28 : 20}px)` },
        { opacity: 1, transform: 'translateY(0)' },
      ], {
        duration: isVisual ? 900 : 720,
        delay: Math.min(index * 75, 225),
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'backwards',
      });
      element.removeAttribute('data-entrance-pending');
      entranceAnimations.set(element, animation);
      animation.finished.then(
        () => entranceAnimations.delete(element),
        () => entranceAnimations.delete(element),
      );
    }
  }, { threshold: 0, rootMargin: `0px 0px -${Math.min(100, window.innerHeight * 0.12)}px 0px` });

  entranceElements.forEach(element => {
    // Content above a restored scroll position should never be left hidden.
    if (element.getBoundingClientRect().bottom <= 0) return;
    element.setAttribute('data-entrance-pending', '');
    entranceObserver!.observe(element);
  });
}

// Keyboard navigation and preference changes must never wait for an entrance.
document.addEventListener('focusin', event => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  entranceElements.filter(element => element.contains(target)).forEach(showImmediately);
});
motionPreference.addEventListener('change', event => {
  if (!event.matches) return;
  entranceObserver?.disconnect();
  entranceElements.forEach(showImmediately);
});

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
