import {t} from '../i18n/core';
export function setupTimeline() {
  const strip = document.querySelector<HTMLElement>('.timeline-strip')!;
  const navigator = document.querySelector<HTMLElement>('.timeline-navigator')!;
  const slider = document.querySelector<HTMLInputElement>('#timeline-position')!;
  const cards = [...strip.querySelectorAll<HTMLElement>('.timeline-card')];
  const steps = [...navigator.querySelectorAll<HTMLButtonElement>('[data-timeline-step]')];
  let current = -1;
  let frame = 0;

  function offsets() {
    const first = cards[0]!.getBoundingClientRect().left;
    return cards.map(card => card.getBoundingClientRect().left - first);
  }
  function select(index: number) {
    if (index === current) return;
    current = index;
    const card = cards[index]!;
    const year = card.querySelector('time')!.textContent!;
    const title = card.querySelector('h3')!.textContent!;
    slider.value = String(index + 1);
    slider.setAttribute('aria-valuetext', t(`${year}: ${title}, ${index + 1} of ${cards.length}`));
    navigator.querySelector('[data-timeline-year]')!.textContent = year;
    navigator.querySelector('[data-timeline-title]')!.textContent = title;
    navigator.querySelector('[data-timeline-count]')!.textContent = `${String(index + 1).padStart(2, '0')} / ${cards.length}`;
    cards.forEach((item, i) => item.toggleAttribute('data-timeline-current', i === index));
    for (const button of steps) button.disabled = Number(button.dataset.timelineStep) < 0 ? index === 0 : index === cards.length - 1;
  }
  function move(index: number, animate = false) {
    index = Math.max(0, Math.min(cards.length - 1, index));
    select(index);
    strip.scrollTo({
      left: offsets()[index]!,
      behavior: animate && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant',
    });
  }
  function sync() {
    const positions = offsets();
    const index = positions.reduce((best, left, i) => Math.abs(left - strip.scrollLeft) < Math.abs(positions[best]! - strip.scrollLeft) ? i : best, 0);
    select(index);
  }
  slider.addEventListener('input', () => move(Number(slider.value) - 1));
  for (const button of steps) button.addEventListener('click', () => move(current + Number(button.dataset.timelineStep), true));
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-era]')) button.addEventListener('click', () => {
    const index = cards.findIndex(card => card.id === button.dataset.era);
    if (index >= 0) {
      move(index, true);
      strip.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  });
  strip.addEventListener('keydown', event => {
    if (event.target !== strip) return;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : event.key === 'ArrowLeft' ? current - 1 : event.key === 'ArrowRight' ? current + 1 : undefined;
    if (next === undefined) return;
    event.preventDefault();
    move(next);
  });
  strip.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(sync);
  }, { passive: true });
  function resize() {
    const padding = parseFloat(getComputedStyle(strip).paddingLeft);
    strip.querySelector<HTMLElement>('.timeline-cards')!.style.paddingRight = `${Math.max(0, strip.clientWidth - cards[0]!.offsetWidth - padding * 2)}px`;
    if (current >= 0) move(current);
    sync();
  }
  new ResizeObserver(resize).observe(strip);
  navigator.hidden = false;
  resize();
  sync();
  // Native fragment scrolling only brings a card into view; align its stop too.
  function followBookmark() {
    const index = cards.findIndex(card => `#${card.id}` === location.hash);
    if (index >= 0) move(index);
  }
  followBookmark();
  window.addEventListener('load', followBookmark);
  window.addEventListener('pageshow', followBookmark);
  window.addEventListener('hashchange', followBookmark);
}
