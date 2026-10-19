import { productImages } from './content.ts';
import { setupIndicators } from './indicators.ts';
import { initAurora } from './aurora.ts';

setupIndicators();

// A matching second group makes the marquee wrap without a visible jump.
for (const reviewTrack of document.querySelectorAll<HTMLElement>('.review-track')) {
  const reviewGroup = reviewTrack.querySelector<HTMLElement>('.review-group');
  if (!reviewGroup) continue;
  const duplicate = reviewGroup.cloneNode(true) as HTMLElement;
  duplicate.setAttribute('aria-hidden', 'true');
  duplicate.inert = true;
  reviewTrack.append(duplicate);
  reviewTrack.classList.add('is-looping');
}

const auroraCleanups = Array.from(document.querySelectorAll<HTMLCanvasElement>('.aurora-canvas')).map(canvas => initAurora(canvas));
const stopAurora = () => auroraCleanups.forEach(cleanup => cleanup());

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
  '.hero .centered-heading > *',
  '.section-heading', '.split-heading', '.coverage-card',
  '.platform-media', '.platform-caption', '.depth-feature', '.depth-visual',
  '.workflow-card', '.feature-copy', '.pricing-card', '.pricing-note',
  '.faq-heading', '.faq-list details',
  '.indicator-track',
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
      const isVisual = element.matches('.platform-media, .depth-visual');
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

// Animate only illustration children; copy uses the shared entrance above.
// The HTML/CSS is the finished state, so no JS or reduced motion needs no fallback.
function setupFeatureIllustrations() {
  if (motionPreference.matches || !('IntersectionObserver' in window) || !('animate' in Element.prototype)) return;
  const cards = [...document.querySelectorAll<HTMLElement>('.feature-card')];
  const started = new Set<Element>();
  const visible = new Set<Element>();
  const active = new Map<Element, Animation[]>();

  function start(card: Element) {
    started.add(card);
    const animations = [...card.querySelectorAll<HTMLElement | SVGElement>('[data-feature-reveal], [data-feature-draw], [data-feature-ring]')].map(element => {
      const delay = Number(element.style.getPropertyValue('--feature-delay')) || 0;
      const isLine = element.hasAttribute('data-feature-draw');
      const isRing = element.hasAttribute('data-feature-ring');
      const frames: Keyframe[] = isLine
        ? [{ strokeDasharray: '1', strokeDashoffset: '1' }, { strokeDasharray: '1', strokeDashoffset: '0' }]
        : isRing
          ? [{ strokeDasharray: '0 100' }, { strokeDasharray: '68 100' }]
          : [{ opacity: 0, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }];
      const animation = element.animate(frames, {
        duration: isLine ? 2300 : isRing ? 1800 : 850,
        delay,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'backwards',
      });
      animation.pause();
      return animation;
    });
    active.set(card, animations);
    Promise.all(animations.map(animation => animation.finished)).then(() => {
      active.delete(card);
      visible.delete(card);
      observer.unobserve(card);
    }).catch(() => { /* Preference changes cancel and reveal the static artwork. */ });
  }

  function sync() {
    for (const [card, animations] of active) {
      for (const animation of animations) {
        if (animation.playState === 'finished') continue;
        if (!document.hidden && visible.has(card)) animation.play();
        else animation.pause();
      }
    }
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        visible.add(entry.target);
        if (!document.hidden && !started.has(entry.target)) start(entry.target);
      } else visible.delete(entry.target);
    }
    sync();
  }, { threshold: 0.15 });

  function onVisibilityChange() {
    if (!document.hidden) {
      for (const card of visible) if (!started.has(card)) start(card);
    }
    sync();
  }

  function onMotionChange(event: MediaQueryListEvent) {
    if (event.matches) cleanup();
  }

  function cleanup() {
    observer.disconnect();
    active.forEach(animations => animations.forEach(animation => animation.cancel()));
    active.clear();
    visible.clear();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    motionPreference.removeEventListener('change', onMotionChange);
    window.removeEventListener('pagehide', onPageHide);
  }

  function onPageHide(event: PageTransitionEvent) {
    // Keep observers for a restored page in the back/forward cache.
    if (!event.persisted) cleanup();
  }

  cards.forEach(card => observer.observe(card));
  document.addEventListener('visibilitychange', onVisibilityChange);
  motionPreference.addEventListener('change', onMotionChange);
  window.addEventListener('pagehide', onPageHide);
}

setupFeatureIllustrations();
window.addEventListener('pagehide', stopAurora);

document.querySelector('#copyright-year')!.textContent = String(new Date().getFullYear());
