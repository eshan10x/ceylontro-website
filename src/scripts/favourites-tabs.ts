/**
 * Upgrades the Home "House favourites" pills from links into an ARIA tab list.
 * Click or Enter/Space selects; Left/Right, Home and End move between tabs.
 */
for (const root of document.querySelectorAll<HTMLElement>('[data-favourites]')) {
  const list = root.querySelector<HTMLElement>('[data-tablist]');
  const tabs = [...root.querySelectorAll<HTMLAnchorElement>('[data-tab]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-panel]')];
  if (!list || tabs.length < 2) continue;

  list.setAttribute('role', 'tablist');

  const select = (index: number, focus = false) => {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    });
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });
  };

  tabs.forEach((tab, i) => {
    const panel = panels[i];
    tab.setAttribute('role', 'tab');
    tab.removeAttribute('aria-current');
    if (panel) {
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
    }

    tab.addEventListener('click', (event) => {
      event.preventDefault();
      select(i);
    });

    tab.addEventListener('keydown', (event) => {
      const last = tabs.length - 1;
      const next: Record<string, number> = {
        ArrowRight: i === last ? 0 : i + 1,
        ArrowLeft: i === 0 ? last : i - 1,
        Home: 0,
        End: last,
      };
      const target = next[event.key];
      if (target !== undefined) {
        event.preventDefault();
        select(target, true);
      } else if (event.key === ' ') {
        event.preventDefault();
        select(i);
      }
    });
  });

  select(0);
}
