import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

// Subtle homepage motion: a staggered hero reveal on load, and a gentle
// fade-up for each content block as it scrolls into view.
// Respects prefers-reduced-motion (the `gsap-anim` gate is only added when motion is OK).

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function run() {
  gsap.registerPlugin(ScrollTrigger);

  // --- Hero: staggered load reveal (elements pre-hidden via .gsap-anim CSS) ---
  const col = document.querySelector('#top [data-hero-col]');
  if (col) {
    const items = gsap.utils.toArray<HTMLElement>(Array.from(col.children));
    gsap.set(items, { y: 14 });
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.55,
      ease: 'power2.out',
      stagger: 0.07,
      delay: 0.05,
    });
  }
  const img = document.querySelector<HTMLElement>('#top [data-anim="hero-img"]');
  if (img) {
    gsap.set(img, { scale: 1.04, transformOrigin: '50% 50%' });
    gsap.to(img, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out', delay: 0.12 });
  }

  // --- Scroll reveals: every top-level content block after the hero ---
  const children = Array.from(document.body.children) as HTMLElement[];
  const heroIdx = children.findIndex((el) => el.id === 'top');
  const blocks = children.slice(heroIdx + 1).filter((el) => {
    if (el.tagName === 'FOOTER') return false; // leave the footer static
    const pos = getComputedStyle(el).position;
    if (pos === 'fixed' || pos === 'sticky') return false; // skip promo/sticky bars
    return el.offsetHeight > 0;
  });
  blocks.forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 24,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  document.documentElement.classList.add('gsap-ready');
}

if (!reduce) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}
