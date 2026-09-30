const root = document.querySelector<HTMLElement>('[data-drawer]');
const panel = root?.querySelector<HTMLElement>('[data-drawer-panel]');
const toggles = document.querySelectorAll<HTMLElement>('[data-drawer-toggle]');
let returnFocusTo: HTMLElement | null = null;

const FOCUSABLE = 'a[href], button:not([disabled]), summary, input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function setTogglesExpanded(expanded: boolean) {
  toggles.forEach(b => b.setAttribute('aria-expanded', String(expanded)));
}

function visibleFocusables(): HTMLElement[] {
  return [...(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter(el => el.offsetParent !== null);
}

function open(trigger: HTMLElement) {
  if (!root) return;
  returnFocusTo = trigger;
  root.setAttribute('data-open', '');
  setTogglesExpanded(true);
  // Land on the close button so the first Tab continues into the menu.
  panel?.querySelector<HTMLElement>('button[data-drawer-close]')?.focus();
}

function close() {
  if (!root?.hasAttribute('data-open')) return;
  root.removeAttribute('data-open');
  setTogglesExpanded(false);
  returnFocusTo?.focus();
  returnFocusTo = null;
}

toggles.forEach(b =>
  b.addEventListener('click', () => (root?.hasAttribute('data-open') ? close() : open(b)))
);

document.querySelectorAll('[data-drawer-close]').forEach(b => b.addEventListener('click', close));

// Keyboard: Escape closes; Tab wraps inside the open menu (it's a modal dialog).
document.addEventListener('keydown', (e) => {
  if (!root?.hasAttribute('data-open')) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    close();
    return;
  }
  if (e.key !== 'Tab') return;
  const items = visibleFocusables();
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement as HTMLElement | null;
  if (e.shiftKey && (active === first || !panel?.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !panel?.contains(active))) {
    e.preventDefault();
    first.focus();
  }
});
