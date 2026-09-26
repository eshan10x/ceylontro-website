/**
 * Site shell behaviour — the only JavaScript the shell ships.
 *
 * 1. Header: marks it as scrolled once a sentinel 40 px down the page leaves the viewport.
 * 2. Drawer: fallback for browsers without the HTML `command` attribute; closes the drawer
 *    when a link inside it is used or when the window grows to desktop width.
 * 3. Hours: reveals today's opening hours for the visitor's weekday.
 */

const header = document.getElementById('site-header');
const sentinel = document.querySelector('[data-header-sentinel]');

if (header && sentinel && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    header.dataset['scrolled'] = String(!entry?.isIntersecting);
  }).observe(sentinel);
}

const drawer = document.getElementById('site-drawer');

if (drawer instanceof HTMLDialogElement) {
  if (!('command' in HTMLButtonElement.prototype)) {
    document.addEventListener('click', (event) => {
      const button = (event.target as Element | null)?.closest<HTMLButtonElement>('button[commandfor="site-drawer"]');
      if (!button) return;
      if (button.getAttribute('command') === 'show-modal') drawer.showModal();
      else drawer.close();
    });
  }

  // Close before navigating so a page restored from the back/forward cache isn't left with it open.
  drawer.addEventListener('click', (event) => {
    if ((event.target as Element | null)?.closest('a')) drawer.close();
  });

  matchMedia('(min-width: 64rem)').addEventListener('change', (query) => {
    if (query.matches) drawer.close();
  });
}

const today = String(new Date().getDay());
for (const line of document.querySelectorAll<HTMLElement>('[data-weekday]')) {
  line.hidden = line.dataset['weekday'] !== today;
}
