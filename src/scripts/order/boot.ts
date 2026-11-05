/**
 * Menu ordering, first stage (small, always loaded on /menu):
 * - marks the page open or closed for ordering (Toronto time), which shows or hides the Add
 *   buttons, the order panel and the closed notice, and re-checks every minute;
 * - keeps the View order bar and counts up to date;
 * - loads the ordering screens (`app.ts`) only when the guest adds a dish or opens the order.
 */
import { ORDERING } from '@/ordering/config';
import { orderingWindow, toClock } from '@/ordering/hours';
import { dayName, formatTime } from '@/lib/format';
import { getLines } from '@/ordering/client/store';
import { syncChrome } from '@/ordering/client/chrome';

type App = typeof import('./app');

if (ORDERING.enabled) init();

function init(): void {
  const root = document.documentElement;

  function checkHours(): boolean {
    const window_ = orderingWindow();
    root.dataset['ordering'] = window_.open ? 'open' : 'closed';
    const next = window_.next;
    const label = document.querySelector<HTMLElement>('[data-order-next]');
    if (label && next) {
      const time = formatTime(toClock(next.minutes));
      const tomorrow = new Date(Date.now() + 864e5).toLocaleDateString('en-CA', { weekday: 'long', timeZone: 'America/Toronto' }).toLowerCase();
      label.textContent = next.isToday
        ? `at ${time}`
        : next.weekday === tomorrow
          ? `tomorrow at ${time}`
          : `${dayName(next.weekday)} at ${time}`;
    }
    syncChrome();
    return window_.open;
  }

  let app: Promise<App> | null = null;

  function load(): Promise<App> {
    app ??= import('./app')
      .then(async (module) => {
        await module.start();
        return module;
      })
      .catch((error: unknown) => {
        app = null;
        throw error;
      });
    return app;
  }

  function failed(error: unknown): void {
    console.error(error);
    const toast = document.querySelector<HTMLElement>('[data-order-toast]');
    if (!toast) return;
    toast.innerHTML =
      '<p class="pointer-events-auto rounded-2xl bg-ink px-4 py-3 text-[0.875rem] text-cream shadow-soft">Sorry, ordering didn’t load. Please check your connection and try again.</p>';
    setTimeout(() => (toast.innerHTML = ''), 6000);
  }

  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const add = target?.closest<HTMLElement>('[data-order-add]');
    if (add) {
      event.preventDefault();
      add.setAttribute('aria-busy', 'true');
      load()
        .then((m) => m.openItem(add.dataset['orderAdd'] ?? ''))
        .catch(failed)
        .finally(() => add.removeAttribute('aria-busy'));
      return;
    }
    const open = target?.closest('[data-order-open], a[href="/menu#your-order"]');
    if (open && getLines().length) {
      event.preventDefault();
      load().then((m) => m.openOrder()).catch(failed);
    }
  });

  window.addEventListener('order:change', syncChrome);
  window.addEventListener('storage', syncChrome);

  const open = checkHours();
  setInterval(checkHours, 60_000);

  if (location.hash === '#your-order') {
    history.replaceState(null, '', location.pathname + location.search);
    if (getLines().length) load().then((m) => m.openOrder()).catch(failed);
  } else if (open && getLines().length && matchMedia('(min-width: 90rem)').matches) {
    // Wide screens show the order beside the menu: fill it in once the page is idle.
    (window.requestIdleCallback ?? setTimeout)(() => void load().catch(failed));
  }
}
