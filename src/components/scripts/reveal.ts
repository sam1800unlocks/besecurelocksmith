// Lightweight entrance reveals — replaces GSAP (~115 KB) with ~1 KB of vanilla
// JS. Adds `.is-visible` to targets as they enter the viewport; the visuals are
// CSS transitions (see the <style> block in index.astro, gated by `.reveal-js`).
// Respects prefers-reduced-motion: the inline gate only adds `.reveal-js` when
// motion is OK, so reduced-motion / no-JS users get fully-visible content.
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const start = () => {
    const root = document.documentElement;

    // Per-child stagger index (consumed by CSS transition-delay: calc(var(--i)…)).
    document.querySelectorAll('[data-hero-col],[data-stagger],[data-cards]').forEach((c) => {
      Array.from(c.children).forEach((el, i) =>
        (el as HTMLElement).style.setProperty('--i', String(i)),
      );
    });

    // Reveal each target once, when it scrolls into view.
    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
    );
    document
      .querySelectorAll(
        '#top [data-hero-col],#top [data-anim="hero-img"],main > :not(#top),[data-stagger],[data-cards],[data-star-draw]',
      )
      .forEach((el) => io.observe(el));

    // Count-up numbers (the final value is already in the HTML for no-JS users).
    document.querySelectorAll<HTMLElement>('[data-countup]').forEach((el) => {
      const target = parseFloat(el.dataset.countup || '0');
      const decimals = parseInt(el.dataset.countupDecimals || '0', 10);
      const cio = new IntersectionObserver(
        (entries, obs) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          obs.disconnect();
          const dur = 1000;
          let t0 = 0;
          const tick = (now: number) => {
            if (!t0) t0 = now;
            const p = Math.min(1, (now - t0) / dur);
            const v = target * (1 - Math.pow(1 - p, 2)); // ease-out quad
            el.textContent = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US');
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        },
        { rootMargin: '0px 0px -10% 0px' },
      );
      cio.observe(el);
    });

    // One-time CTA shine + pulse (CSS-driven), after the hero settles.
    const cta = document.querySelector('[data-cta-shine]');
    if (cta) setTimeout(() => cta.classList.add('shine'), 800);

    // Failsafe: reveal anything still hidden after a few seconds — covers
    // crawlers that don't scroll and any IntersectionObserver edge case, so
    // content is never left invisible.
    setTimeout(() => {
      document
        .querySelectorAll(
          '#top [data-hero-col],#top [data-anim="hero-img"],main > :not(#top),[data-stagger],[data-cards],[data-star-draw]',
        )
        .forEach((el) => el.classList.add('is-visible'));
    }, 3000);

    root.classList.add('reveal-ready');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}
