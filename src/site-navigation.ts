export function setupSiteNavigation() {
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

  document.querySelector('#copyright-year')!.textContent = String(new Date().getFullYear());
}
