// Gentle motion for the public site:
//  - cards, headings and photos fade up as they scroll into view
//  - numbers marked [data-countup] (e.g. "1000+") count up when first seen
// Nothing happens for visitors who prefer reduced motion, and everything is fully visible without JS.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const REVEAL = [
  '.section-heading',
  '.card',
  '.program',
  '.facilities li',
  '.gallery li',
  '.moments li',
  '.offered__item',
  '.stat',
  '.care__media',
  '.about__media',
  '.faq__item',
  '.job',
  '.steps__item',
].join(',');

function inViewport(el: Element) {
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
}

function setupReveal() {
  const targets = [...document.querySelectorAll<HTMLElement>(REVEAL)].filter(
    (el) => !el.closest('.hero, .page-hero') && !inViewport(el),
  );
  if (!targets.length) return;

  // Stagger items that sit side by side in the same parent.
  const order = new Map<HTMLElement, number>();
  for (const el of targets) {
    const siblings = targets.filter((t) => t.parentElement === el.parentElement);
    order.set(el, siblings.indexOf(el));
  }

  // Hidden through CSS (screen only), so printing still shows everything.
  for (const el of targets) el.dataset.reveal = 'pending';

  const reveal = (el: HTMLElement, fade: boolean) => {
    el.dataset.reveal = 'done';
    if (!fade) return;
    const delay = Math.min(order.get(el) ?? 0, 5) * 70;
    el.animate(
      [
        { opacity: 0, transform: 'translateY(22px) scale(0.98)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 650, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' },
    );
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (!entry.isIntersecting || el.dataset.reveal !== 'pending') continue;
        // A card in a row that scrolls sideways (Strip.astro) brings the rest of the row with it, so a
        // card swiped in later is already there rather than blank for a moment. Decided now, not at
        // load: a phones-only strip is a grid on wider screens, and a phone can be turned. If some of
        // the row was on screen at load (as a grid), the cards still to come just appear.
        const track = el.parentElement!;
        const row = track.matches('[data-strip-track]') && getComputedStyle(track).overflowX !== 'visible';
        const cards = row ? targets.filter((t) => t.parentElement === track && t.dataset.reveal === 'pending') : [el];
        const fade = !row || [...track.children].every((c) => !c.matches(REVEAL) || cards.includes(c as HTMLElement));
        for (const card of cards) {
          observer.unobserve(card);
          reveal(card, fade);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  for (const el of targets) observer.observe(el);
}

function setupCountUp() {
  const items = document.querySelectorAll<HTMLElement>('[data-countup]');
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLElement;
      observer.unobserve(el);
      const match = el.textContent?.trim().match(/^(\d+)(.*)$/);
      if (!match) continue;
      const target = Number(match[1]);
      const suffix = match[2] ?? '';
      const start = performance.now();
      const duration = 1400;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = `${Math.round(target * eased)}${suffix}`;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  });
  items.forEach((el) => observer.observe(el));
}

if (!reduceMotion && 'IntersectionObserver' in window && 'animate' in Element.prototype) {
  setupReveal();
  setupCountUp();
}
