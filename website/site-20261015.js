/**
 * Dikenocracy — site behaviour (direction: DIRECTION.md). No dependencies.
 *   1. Navigation bar gets a shadow once the page scrolls under it.
 *   2. Dateline: today's date in the Gregorian, Hebrew and DTI calendars, computed by the
 *      canonical converter (converter/converter.js, loaded before this file where used).
 *   3. Section entrances: only elements that start below the fold are hidden, so nothing
 *      stays invisible if this script fails; reduced motion skips it entirely.
 *   4. Protocol explorer: search and layer filter over the static index.
 * Loaded with `defer`.
 */
(function () {
  'use strict';

  /* 1. Navigation shadow */
  var nav = document.querySelector('.site-nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 4); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* 2. Dateline */
  var HEB_MONTHS = ['', 'Nisan', 'Iyyar', 'Sivan', 'Tammuz', 'Av', 'Elul', 'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar', 'Adar II'];
  document.querySelectorAll('[data-dateline]').forEach(function (el) {
    if (typeof gregorianToJdn !== 'function' || typeof jdnToDti !== 'function') return;
    var now = new Date();
    var y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
    var jdn = gregorianToJdn(y, m, d);
    var greg = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var parts = [greg];
    if (typeof jdnToHebrew === 'function') {
      var h = jdnToHebrew(jdn);
      var leapAdar = h.month === 12 && typeof hebrewLeapYear === 'function' && hebrewLeapYear(h.year);
      parts.push(h.day + ' ' + (leapAdar ? 'Adar I' : HEB_MONTHS[h.month]) + ' ' + h.year);
    }
    var dti = fmtDti(jdnToDti(jdn));
    var target = el.querySelector('[data-dateline-text]') || el;
    target.textContent = '';
    var lead = document.createElement('span');
    lead.textContent = 'Today: ' + parts.join(' · ') + ' · ';
    var strong = document.createElement('span');
    strong.className = 'dateline__dti';
    strong.textContent = dti;
    target.appendChild(lead);
    target.appendChild(strong);
    target.appendChild(document.createTextNode(' in Dikenocratic time.'));
  });

  /* 3. Section entrances */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var groups = document.querySelectorAll('[data-reveal]');
  if (groups.length && !reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    groups.forEach(function (group) {
      var items = group.matches('[data-reveal="self"]') ? [group] : Array.prototype.slice.call(group.children);
      items.forEach(function (item, i) {
        if (item.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave it alone
        item.classList.add('reveal');
        item.style.setProperty('--d', Math.min(i, 6) * 70 + 'ms');
        io.observe(item);
      });
    });
  }

  /* 4. Protocol explorer */
  var explorer = document.querySelector('[data-explorer]');
  if (explorer) {
    var bar = explorer.querySelector('.explorer__bar');
    var input = explorer.querySelector('[data-explorer-search]');
    var buttons = Array.prototype.slice.call(explorer.querySelectorAll('[data-layer-filter]'));
    var groupsEls = Array.prototype.slice.call(explorer.querySelectorAll('.layer-group'));
    var count = explorer.querySelector('[data-explorer-count]');
    var empty = explorer.querySelector('[data-explorer-empty]');
    var layer = 'all';
    if (bar) bar.hidden = false;

    var apply = function () {
      var q = (input && input.value || '').trim().toLowerCase();
      var shown = 0;
      groupsEls.forEach(function (g) {
        var inLayer = layer === 'all' || g.getAttribute('data-layer') === layer;
        var any = 0;
        g.querySelectorAll('.proto-row').forEach(function (row) {
          var ok = inLayer && (!q || row.getAttribute('data-search').indexOf(q) !== -1);
          row.hidden = !ok;
          if (ok) any++;
        });
        g.hidden = !any;
        shown += any;
      });
      if (count) count.textContent = shown + (shown === 1 ? ' document' : ' documents');
      if (empty) empty.hidden = shown !== 0;
    };
    if (input) input.addEventListener('input', apply);
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        layer = b.getAttribute('data-layer-filter');
        buttons.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        apply();
      });
    });
    var params = new URLSearchParams(window.location.search);
    if (input && params.get('q')) input.value = params.get('q');
    apply();
  }
}());
