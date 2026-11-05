// Gentle motion for the public site:
//  - cards, headings and photos fade up as they scroll into view; icon badges pop, photos settle
//    into their frames and the underline under a heading's highlighted words draws itself
//  - numbers marked [data-countup] (e.g. "1000+") count up when first seen
//  - the doodles drift a little as the page scrolls, and wiggle when tapped or clicked
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
    // Its icon badge pops in just after, with a little bounce.
    for (const badge of el.querySelectorAll<HTMLElement>('.icon-badge')) {
      badge.animate(
        [
          { scale: '0.4', rotate: '-12deg', opacity: 0 },
          { scale: '1.12', rotate: '6deg', opacity: 1, offset: 0.6 },
          { scale: '1', rotate: '0deg', opacity: 1 },
        ],
        { duration: 620, delay: delay + 220, easing: 'cubic-bezier(.3,.8,.3,1.2)', fill: 'backwards' },
      );
    }
    // Photos settle into their frames (the frame clips the slight zoom).
    for (const img of el.querySelectorAll<HTMLElement>('img')) {
      img.animate([{ scale: '1.08' }, { scale: '1' }], { duration: 1100, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
    }
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

/** The theme's underline under a heading's highlighted words draws itself from left to right when seen. */
function setupUnderlines() {
  const lines = [...document.querySelectorAll<HTMLElement>('.squiggle')];
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        observer.unobserve(el);
        // A frame later, so the browser has drawn it hidden first and the line animates.
        requestAnimationFrame(() => requestAnimationFrame(() => (el.dataset.draw = 'done')));
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  for (const el of lines) {
    el.dataset.draw = 'pending';
    observer.observe(el);
  }
}

/**
 * The doodles drift a little as the page scrolls, at different speeds, so the page feels deep: the
 * banner's doodles (components/FloatingShapes.astro) and the one beside each section (global.css).
 * They use the CSS `translate` property, which adds to their own floating animation.
 */
function setupDoodleDrift() {
  const banners = [...document.querySelectorAll<HTMLElement>('.fx')];
  const sections = [...document.querySelectorAll<HTMLElement>('main > section')];
  const wide = matchMedia('(min-width: 1360px)');
  let queued = false;
  const update = () => {
    queued = false;
    const vh = window.innerHeight;
    for (const fx of banners) {
      const r = fx.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      fx.style.setProperty('--fx-shift', `${Math.round(-r.top * 0.18)}px`);
    }
    if (!wide.matches) return;
    for (const section of sections) {
      const r = section.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      const progress = Math.max(-1, Math.min(1, (r.top + Math.min(r.height, vh) / 2 - vh / 2) / vh));
      section.style.setProperty('--doodle-shift', `${Math.round(progress * 36)}px`);
    }
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  update();
}

const WIGGLE: Keyframe[] = [
  { rotate: '0deg', scale: '1' },
  { rotate: '-16deg', scale: '1.18', offset: 0.25 },
  { rotate: '12deg', scale: '1.12', offset: 0.5 },
  { rotate: '-6deg', scale: '1.05', offset: 0.75 },
  { rotate: '0deg', scale: '1' },
];

/** Tapping or clicking a doodle makes it wiggle (taps on links and buttons are left alone). */
function setupDoodleWiggle() {
  const inside = (x: number, y: number, r: { left: number; top: number; width: number; height: number }) =>
    x >= r.left && x <= r.left + r.width && y >= r.top && y <= r.top + r.height;
  document.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a, button, input, select, textarea, label, summary, [role="button"]')) return;
    const { clientX: x, clientY: y } = e;
    for (const shape of document.querySelectorAll<HTMLElement>('.fx__shape')) {
      const r = shape.getBoundingClientRect();
      // A little extra room around small doodles, for fingers.
      const pad = Math.max(0, (44 - r.width) / 2);
      if (r.width && inside(x, y, { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 })) {
        shape.animate(WIGGLE, { duration: 750, easing: 'ease-in-out' });
        return;
      }
    }
    // The section doodles are drawn by ::before, so their place comes from its computed box.
    const section = (e.target as Element).closest<HTMLElement>('main > section');
    if (!section) return;
    const before = getComputedStyle(section, '::before');
    if (before.content === 'none' || before.display === 'none') return;
    const s = section.getBoundingClientRect();
    const left = parseFloat(before.left);
    const right = parseFloat(before.right);
    const width = parseFloat(before.width);
    const box = {
      left: Number.isFinite(left) ? s.left + left : s.right - right - width,
      top: s.top + parseFloat(before.top) + parseFloat(section.style.getPropertyValue('--doodle-shift') || '0'),
      width,
      height: width,
    };
    if (inside(x, y, box)) section.animate(WIGGLE, { duration: 750, easing: 'ease-in-out', pseudoElement: '::before' });
  });
}

if (!reduceMotion && 'IntersectionObserver' in window && 'animate' in Element.prototype) {
  setupReveal();
  setupCountUp();
  setupUnderlines();
  setupDoodleDrift();
  setupDoodleWiggle();
}
