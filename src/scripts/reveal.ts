/**
 * Scroll reveals for `[data-reveal]` elements (styles in `global.css`).
 *
 * Content is never hidden by CSS alone: elements are hidden only by this script, and only
 * those still below the fold when it runs, so the first screen never flashes, and without
 * JavaScript (or with reduced motion) everything simply shows. Opacity and transform only,
 * so reveals cause no layout shift.
 */

const root = document.documentElement;
const elements = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
const motionOk = matchMedia('(prefers-reduced-motion: no-preference)').matches;

if (motionOk && elements.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );

  // Measure everything first, then write, so the page lays out once.
  const fold = innerHeight;
  const boxes = elements.map((element) => element.getBoundingClientRect());
  elements.forEach((element, i) => {
    const { top, height } = boxes[i]!;
    // Below the fold: wait for it. On screen, or with no box (a closed dialog, a hidden tab): show as is.
    if (height > 0 && top >= fold) observer.observe(element);
    else element.classList.add('is-revealed');
  });
  root.dataset['motion'] = 'ready';
}
