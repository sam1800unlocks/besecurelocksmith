/**
 * Reviews carousel — progressive enhancement.
 *
 * The viewport div (data-reviews-viewport) uses overflow-x:auto as a no-JS
 * fallback so users can scroll the cards without JavaScript.
 *
 * When JS runs, the prev/next buttons (data-reviews-prev / data-reviews-next)
 * call scrollBy on the viewport for a smooth button-driven experience.
 */

const CARD_STEP = 376; // 360px card + 16px gap

document.querySelectorAll<HTMLElement>('[data-reviews-viewport]').forEach((viewport) => {
  const prev = document.querySelector<HTMLButtonElement>('[data-reviews-prev]');
  const next = document.querySelector<HTMLButtonElement>('[data-reviews-next]');

  if (prev) {
    prev.addEventListener('click', () => {
      viewport.scrollBy({ left: -CARD_STEP, behavior: 'smooth' });
    });
  }

  if (next) {
    next.addEventListener('click', () => {
      viewport.scrollBy({ left: CARD_STEP, behavior: 'smooth' });
    });
  }
});
