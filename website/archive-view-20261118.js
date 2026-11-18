/* Protocol archive: "Current view" / "Classic view" switcher (2026-11-18).
 * Both views are generated from the same catalog (build_release.py). Without JavaScript the current view is shown
 * and the classic view stays hidden (it carries no ids). The switcher moves the shared anchors (#l0-heading …) to the
 * active view, so shared links keep working in both. The choice is remembered when browser storage is available. */
(function () {
  'use strict';
  var KEY = 'dkp-archive-view';
  var root = document.documentElement;
  var bar = document.querySelector('[data-archive-switch]');
  var views = {
    current: document.querySelector('div[data-archive-view="current"]'),
    classic: document.querySelector('div[data-archive-view="classic"]')
  };
  if (!bar || !views.current || !views.classic) return;
  var buttons = Array.prototype.slice.call(bar.querySelectorAll('[data-archive-choose]'));

  function read() { try { return window.localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { window.localStorage.setItem(KEY, v); } catch (e) { /* storage unavailable: still works */ } }

  function moveAnchors(view) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-anchor]'), function (el) {
      if (views[view].contains(el)) el.id = el.getAttribute('data-anchor');
      else if (el.id === el.getAttribute('data-anchor')) el.removeAttribute('id');
    });
  }

  function toHash() {
    if (location.hash.length < 2) return;
    var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  }

  function apply(view, scroll) {
    if (view !== 'classic') view = 'current';
    views.current.hidden = view !== 'current';
    views.classic.hidden = view !== 'classic';
    root.setAttribute('data-archive-mode', view);
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-archive-choose') === view)); });
    moveAnchors(view);
    if (scroll) toHash();
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var view = b.getAttribute('data-archive-choose');
      write(view);
      apply(view, false);
      b.focus();
    });
  });
  bar.hidden = false;
  apply(read(), true);
  // Images and fonts can move the target after the first jump: repeat once the page has loaded.
  if (root.getAttribute('data-archive-mode') === 'classic') window.addEventListener('load', toHash, { once: true });

  /* Classic view: search and one-layer filter over the same documents. */
  var input = views.classic.querySelector('[data-classic-search]');
  var select = views.classic.querySelector('[data-classic-layer]');
  var count = views.classic.querySelector('[data-classic-count]');
  var empty = views.classic.querySelector('[data-classic-empty]');
  var blocks = Array.prototype.slice.call(views.classic.querySelectorAll('.c-layer-block'));
  function filter() {
    var q = (input.value || '').trim().toLowerCase();
    var layer = select.value;
    var shown = 0;
    blocks.forEach(function (block) {
      var inLayer = !layer || block.getAttribute('data-layer') === layer;
      var visible = 0;
      Array.prototype.forEach.call(block.querySelectorAll('.c-protocol-layer'), function (card) {
        var ok = inLayer && (!q || card.getAttribute('data-search').indexOf(q) !== -1);
        card.hidden = !ok;
        visible += ok ? 1 : 0;
      });
      block.hidden = visible === 0;
      shown += visible;
    });
    count.textContent = shown + (shown === 1 ? ' document' : ' documents');
    empty.hidden = shown !== 0;
  }
  if (input && select && count && empty) {
    input.addEventListener('input', filter);
    select.addEventListener('change', filter);
  }
})();
