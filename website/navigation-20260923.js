// Shared by static pages and Shadoo; the Projects link always navigates.
export function initProjectsNavigation(nav) {
  const item = nav.querySelector('.site-nav__has-menu');
  const button = nav.querySelector('.site-nav__submenu-toggle');
  const menu = nav.querySelector('.site-nav__submenu');
  if (!item || !button || !menu) return () => {};
  const setOpen = (open) => { menu.hidden = !open; button.setAttribute('aria-expanded', String(open)); };
  const enter = (e) => { if (e.pointerType === 'mouse') setOpen(true); };
  const leave = (e) => { if (e.pointerType === 'mouse' && !item.contains(document.activeElement)) setOpen(false); };
  const click = () => setOpen(menu.hidden);
  const focus = (e) => { if (e.target !== button) setOpen(true); };
  const blur = (e) => { if (!item.contains(e.relatedTarget)) setOpen(false); };
  const outside = (e) => { if (!item.contains(e.target)) setOpen(false); };
  const key = (e) => {
    if (e.key === 'Escape' && !menu.hidden) { e.preventDefault(); setOpen(false); button.focus(); }
    if (e.key === 'ArrowDown' && (e.target === button || e.target === item.querySelector('a'))) {
      e.preventDefault(); setOpen(true); menu.querySelector('a').focus();
    }
  };
  item.addEventListener('pointerenter', enter); item.addEventListener('pointerleave', leave);
  item.addEventListener('focusin', focus); item.addEventListener('focusout', blur);
  button.addEventListener('click', click); document.addEventListener('keydown', key);
  document.addEventListener('pointerdown', outside);
  return () => {
    item.removeEventListener('pointerenter', enter); item.removeEventListener('pointerleave', leave);
    item.removeEventListener('focusin', focus); item.removeEventListener('focusout', blur);
    button.removeEventListener('click', click); document.removeEventListener('keydown', key);
    document.removeEventListener('pointerdown', outside);
  };
}

document.querySelectorAll('.site-nav').forEach(initProjectsNavigation);
