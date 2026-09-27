/**
 * Menu page scroll-spy. Marks the category in view on both category navigations
 * (`aria-current="true"`), and keeps the active pill visible in the mobile bar.
 * Without JavaScript both navigations are plain anchor links.
 */
const sections = [...document.querySelectorAll<HTMLElement>('[data-menu-section]')];
const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-menu-link]')];
const bar = document.querySelector<HTMLElement>('[data-menu-bar]');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

let current = '';
let lockedUntil = 0;

function setActive(id: string): void {
  if (id === current) return;
  current = id;
  for (const link of links) {
    if (link.dataset['menuLink'] === id) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }

  const pill = bar?.querySelector<HTMLElement>(`[data-menu-link="${id}"]`);
  if (bar && pill && bar.offsetParent !== null) {
    bar.scrollTo({
      left: pill.offsetLeft - (bar.clientWidth - pill.offsetWidth) / 2,
      behavior: reduceMotion.matches ? 'auto' : 'smooth',
    });
  }
}

/** The last category whose top has passed a line 30% down the screen. */
function update(): void {
  if (performance.now() < lockedUntil) return;
  const line = innerHeight * 0.3;
  let active = sections[0]?.id ?? '';
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= line) active = section.id;
    else break;
  }
  // At the very bottom of the page the last category is the one being read.
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) active = sections.at(-1)?.id ?? active;
  setActive(active);
}

if (sections.length && links.length) {
  let queued = false;
  addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        update();
      });
    },
    { passive: true },
  );
  addEventListener('resize', update, { passive: true });

  // A chosen category stays marked while the page scrolls to it.
  for (const link of links) {
    link.addEventListener('click', () => {
      setActive(link.dataset['menuLink'] ?? '');
      lockedUntil = performance.now() + 900;
    });
  }
  addEventListener('scrollend', () => {
    lockedUntil = 0;
    update();
  });

  update();
}
