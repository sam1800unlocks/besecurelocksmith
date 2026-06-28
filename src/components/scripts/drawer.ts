const root = document.querySelector('[data-drawer]');
const toggles = document.querySelectorAll<HTMLElement>('[data-drawer-toggle]');

function setTogglesExpanded(expanded: boolean) {
  toggles.forEach(b => b.setAttribute('aria-expanded', String(expanded)));
}

toggles.forEach(b =>
  b.addEventListener('click', () => {
    root?.toggleAttribute('data-open');
    setTogglesExpanded(root?.hasAttribute('data-open') ?? false);
  })
);

document.querySelectorAll('[data-drawer-close]').forEach(b =>
  b.addEventListener('click', () => {
    root?.removeAttribute('data-open');
    setTogglesExpanded(false);
  })
);
