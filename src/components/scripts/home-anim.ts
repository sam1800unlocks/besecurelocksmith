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
  // Blocks containing [data-stagger] are excluded so the stagger is the only visible effect.
  const children = Array.from(document.body.children) as HTMLElement[];
  const heroIdx = children.findIndex((el) => el.id === 'top');
  const blocks = children.slice(heroIdx + 1).filter((el) => {
    if (el.tagName === 'FOOTER') return false; // leave the footer static
    const pos = getComputedStyle(el).position;
    if (pos === 'fixed' || pos === 'sticky') return false; // skip promo/sticky bars
    if (el.querySelector('[data-stagger]')) return false; // let stagger animate children instead
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

  // --- Count-up: tween 0 → target on scroll-in ---
  // HTML already contains final value (no-JS / reduced-motion users see correct text).
  // data-countup="<numeric-target>"  data-countup-decimals="1" (optional, default 0)
  gsap.utils.toArray<HTMLElement>('[data-countup]').forEach((el) => {
    const target = parseFloat(el.dataset.countup!);
    const decimals = parseInt(el.dataset.countupDecimals ?? '0', 10);
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          v: target,
          duration: 1.0,
          ease: 'power2.out',
          onUpdate() {
            if (decimals > 0) {
              el.textContent = obj.v.toFixed(decimals);
            } else {
              el.textContent = Math.round(obj.v).toLocaleString('en-US');
            }
          },
        });
      },
    });
  });

  // --- Trust-logo stagger: fade + rise children on scroll-in ---
  // data-stagger on a container → its direct children stagger in.
  gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((container) => {
    const kids = Array.from(container.children) as HTMLElement[];
    gsap.from(kids, {
      opacity: 0,
      y: 16,
      stagger: 0.08,
      duration: 0.5,
      ease: 'power2.out',
      scrollTrigger: { trigger: container, start: 'top 85%', once: true },
    });
  });

  // --- Hero CTA emphasis: one-time shine sweep + gentle pulse ---
  // Fires ~0.8s after load (after hero reveal settles). Never loops.
  const ctaBtn = document.querySelector<HTMLElement>('[data-cta-shine]');
  if (ctaBtn) {
    // Ensure the button can clip the shine overlay
    const currentPos = getComputedStyle(ctaBtn).position;
    if (currentPos === 'static') ctaBtn.style.position = 'relative';
    ctaBtn.style.overflow = 'hidden';

    // Build a gradient shine overlay
    const shine = document.createElement('span');
    shine.setAttribute('aria-hidden', 'true');
    shine.style.cssText =
      'position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.30) 50%,transparent 65%);pointer-events:none;border-radius:inherit;';
    ctaBtn.appendChild(shine);

    gsap.delayedCall(0.8, () => {
      // Shine sweep left → right
      gsap.fromTo(
        shine,
        { xPercent: -100 },
        { xPercent: 100, duration: 0.7, ease: 'power1.inOut' }
      );
      // Single gentle pulse (scale 1 → 1.03 → 1)
      gsap.to(ctaBtn, {
        scale: 1.03,
        duration: 0.25,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
        delay: 0.1,
      });
    });
  }

  // --- Reviews: star-draw (left-to-right clip reveal) + card slide-in ---
  // data-star-draw on a wrapper span around Stars → clip-path reveal
  gsap.utils.toArray<HTMLElement>('[data-star-draw]').forEach((el) => {
    gsap.fromTo(
      el,
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: 'inset(0 0% 0 0)',
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      }
    );
  });

  // data-cards on the review track → children stagger slide in x:24→0 + fade
  const cardTrack = document.querySelector<HTMLElement>('[data-cards]');
  if (cardTrack) {
    const cards = Array.from(cardTrack.children) as HTMLElement[];
    gsap.from(cards, {
      opacity: 0,
      x: 24,
      stagger: 0.08,
      duration: 0.5,
      ease: 'power2.out',
      scrollTrigger: { trigger: cardTrack, start: 'top 88%', once: true },
    });
  }

  // --- Keep reveal triggers accurate as lazy images settle ---
  // Below-the-fold images (loading="lazy") finish during scroll and shift layout
  // after ScrollTrigger's load-time refresh, which can leave reveals like the
  // credentials row stuck at opacity:0. Re-refresh on load and as images decode.
  let refreshQueued = 0;
  const refresh = () => {
    cancelAnimationFrame(refreshQueued);
    refreshQueued = requestAnimationFrame(() => ScrollTrigger.refresh());
  };
  window.addEventListener('load', refresh, { once: true });
  document.querySelectorAll<HTMLImageElement>('img').forEach((im) => {
    if (!im.complete) im.addEventListener('load', refresh, { once: true });
  });

  // Hard failsafe: guarantee no reveal target is ever left invisible, even if a
  // ScrollTrigger fails to fire (mirrors the hero's failsafe).
  gsap.delayedCall(3, () => {
    ScrollTrigger.refresh();
    document.querySelectorAll<HTMLElement>('[data-stagger] > *, [data-cards] > *, [data-star-draw]').forEach((el) => {
      if (parseFloat(getComputedStyle(el).opacity) < 0.05) {
        gsap.set(el, { opacity: 1, clearProps: 'transform' });
      }
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
