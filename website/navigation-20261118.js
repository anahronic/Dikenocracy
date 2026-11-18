// Projects menu (2026-11-18; replaces navigation-20260923.js on the site pages; Shadoo keeps the older file).
// The Projects link always navigates; the menu opens on mouse hover, keyboard focus and the toggle (touch).
// A pointer moving slowly from the item to the menu must not close it: the menu box reaches up to the item (CSS
// bridge in .site-nav__submenu::before), a short grace period absorbs a pointer that briefly leaves the item, and a
// pointer heading diagonally for the menu (safe triangle) keeps it open.
const GRACE_MS = 280;
const AIM_MAX_MS = 1500;

export function initProjectsNavigation(nav) {
  const item = nav.querySelector('.site-nav__has-menu');
  const button = nav.querySelector('.site-nav__submenu-toggle');
  const menu = nav.querySelector('.site-nav__submenu');
  if (!item || !button || !menu) return () => {};
  let timer = 0, exit = null, since = 0;
  const stopAim = () => { exit = null; document.removeEventListener('pointermove', aim); };
  const cancel = () => { clearTimeout(timer); timer = 0; stopAim(); };
  const setOpen = (open) => { cancel(); menu.hidden = !open; button.setAttribute('aria-expanded', String(open)); };
  const later = () => { clearTimeout(timer); timer = setTimeout(() => setOpen(false), GRACE_MS); };
  // Safe triangle: after leaving the item, a pointer that keeps moving inside the triangle between the exit point and
  // the menu's top edge (with a small margin) is heading for the menu, so the grace period is renewed - at most
  // AIM_MAX_MS in total. Any other movement lets the grace period run out. Nothing overlays the neighbouring links.
  const inside = (x, y) => {
    const r = menu.getBoundingClientRect();
    const a = { x: exit.x, y: exit.y - 4 }, b = { x: r.left - 12, y: r.top + 2 }, c = { x: r.right + 12, y: r.top + 2 };
    const s = (p, q, t) => (q.x - p.x) * (t.y - p.y) - (q.y - p.y) * (t.x - p.x);
    const p = { x, y }, d1 = s(a, b, p), d2 = s(b, c, p), d3 = s(c, a, p);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };
  function aim(e) {
    if (exit && performance.now() - since < AIM_MAX_MS && inside(e.clientX, e.clientY)) later();
  }
  const enter = (e) => { if (e.pointerType === 'mouse') setOpen(true); };
  const leave = (e) => {
    if (e.pointerType !== 'mouse' || item.contains(document.activeElement)) return;
    cancel();
    if (!menu.hidden) { exit = { x: e.clientX, y: e.clientY }; since = performance.now(); document.addEventListener('pointermove', aim); }
    later();
  };
  const click = () => setOpen(menu.hidden);
  const focus = (e) => { if (e.target !== button) setOpen(true); else cancel(); };
  const blur = (e) => { if (!item.contains(e.relatedTarget)) setOpen(false); };
  const outside = (e) => { if (!item.contains(e.target)) setOpen(false); };
  const key = (e) => {
    if (e.key === 'Escape' && !menu.hidden) { e.preventDefault(); setOpen(false); button.focus(); }
    if (e.key === 'ArrowDown' && (e.target === button || e.target === item.querySelector('a'))) {
      e.preventDefault(); setOpen(true); menu.querySelector('a').focus();
    }
  };
  const closeOnShow = () => setOpen(false);         // back/forward cache must not restore an open menu
  item.addEventListener('pointerenter', enter); item.addEventListener('pointerleave', leave);
  item.addEventListener('focusin', focus); item.addEventListener('focusout', blur);
  button.addEventListener('click', click); document.addEventListener('keydown', key);
  document.addEventListener('pointerdown', outside); window.addEventListener('pageshow', closeOnShow);
  return () => {
    cancel();
    item.removeEventListener('pointerenter', enter); item.removeEventListener('pointerleave', leave);
    item.removeEventListener('focusin', focus); item.removeEventListener('focusout', blur);
    button.removeEventListener('click', click); document.removeEventListener('keydown', key);
    document.removeEventListener('pointerdown', outside); window.removeEventListener('pageshow', closeOnShow);
  };
}

document.querySelectorAll('.site-nav').forEach(initProjectsNavigation);
