const root = document.querySelector('[data-drawer]');
document.querySelectorAll('[data-drawer-toggle]').forEach(b =>
  b.addEventListener('click', () => root?.toggleAttribute('data-open'))
);
document.querySelectorAll('[data-drawer-close]').forEach(b =>
  b.addEventListener('click', () => root?.removeAttribute('data-open'))
);
