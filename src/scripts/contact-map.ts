/**
 * Contact map: replaces the "Load map" placeholder with the Google Maps embed on click,
 * so no third-party request is made until the visitor asks. Focus moves to the map.
 */
for (const map of document.querySelectorAll<HTMLElement>('[data-map]')) {
  const button = map.querySelector<HTMLAnchorElement>('[data-map-load]');
  const idle = map.querySelector<HTMLElement>('[data-map-idle]');
  const template = map.querySelector<HTMLTemplateElement>('[data-map-template]');
  if (!button || !idle || !template) continue;

  button.setAttribute('role', 'button');
  button.addEventListener('click', (event) => {
    event.preventDefault();
    const frame = template.content.firstElementChild?.cloneNode(true);
    if (!(frame instanceof HTMLIFrameElement)) return;
    frame.tabIndex = -1;
    map.append(frame);
    idle.remove();
    frame.focus();
  });
}
