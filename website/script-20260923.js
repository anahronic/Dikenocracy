/**
 * Dikenocracy — Public Website
 * script.js
 *
 * Responsibilities:
 *   1. Manage intro → welcome screen transition on index.html
 *   2. Mobile nav toggle on all inner pages
 *
 * No external dependencies.
 * All timing in milliseconds.
 */

(function () {
  'use strict';

  /* ─── Constants ──────────────────────────────────────────────────────────── */

  var INTRO_DURATION_MS = 5000;   // how long the intro screen is shown
  var FADE_DURATION_MS  = 300;     // must match CSS --fade transition duration
  var INTERSTITIAL_MS   = 600;     // protocol loading overlay duration

  /* ─── Intro / Welcome Sequence ───────────────────────────────────────────── */

  /**
   * Runs only when the page has #intro-screen and #welcome-screen (index.html).
   * Flow:
   *   1. Show intro at full opacity immediately.
   *   2. After INTRO_DURATION_MS, fade intro out.
   *   3. Simultaneously fade welcome screen in.
   * Graceful: if images are slow, the sequence still starts from DOM-ready —
   * the browser will render the background once loaded.
   */
  function initIntroSequence() {
    var introEl   = document.getElementById('intro-screen');
    var welcomeEl = document.getElementById('welcome-screen');

    if (!introEl || !welcomeEl) {
      return; // not on index.html, nothing to do
    }

    // Ensure initial state: intro fully visible, welcome hidden
    introEl.classList.remove('screen--hidden');
    welcomeEl.classList.add('screen--hidden');

    // Schedule the transition
    setTimeout(function () {
      // Fade intro out
      introEl.classList.add('screen--hidden');

      // Fade welcome in — a tiny delay matches the CSS transition overlap for
      // a smooth cross-fade rather than a hard cut
      setTimeout(function () {
        welcomeEl.classList.remove('screen--hidden');
      }, 40);

    }, INTRO_DURATION_MS);
  }

  /* ─── Interstitial (enter button, welcome → framework) ────────────────────── */

  /**
   * When the user clicks "Connect to Reality", briefly show the
   * "Initializing protocol layer…" interstitial before navigating.
   */
  function initInterstitial() {
    var enterBtn      = document.getElementById('enter-btn');
    var interstitialEl = document.getElementById('interstitial');

    if (!enterBtn || !interstitialEl) return;

    enterBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var dest = enterBtn.getAttribute('href');

      interstitialEl.removeAttribute('aria-hidden');
      interstitialEl.classList.add('is-active');

      setTimeout(function () {
        window.location.href = dest;
      }, INTERSTITIAL_MS);
    });
  }

  /* ─── Mobile Navigation Toggle ───────────────────────────────────────────── */

  /**
   * Wires the hamburger toggle to the nav link list.
   * Runs on all pages that include a .site-nav element.
   */
  function initMobileNav() {
    var toggleBtn = document.querySelector('.site-nav__toggle');
    var linksList = document.querySelector('.site-nav__links');

    if (!toggleBtn || !linksList) {
      return;
    }

    toggleBtn.addEventListener('click', function () {
      var isOpen = linksList.classList.toggle('is-open');
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close nav when a link is activated (mobile UX)
    linksList.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        linksList.classList.remove('is-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      });
    });

    // Close nav on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && linksList.classList.contains('is-open')) {
        linksList.classList.remove('is-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.focus();
      }
    });
  }

  /* ─── Protocol TOC ─────────────────────────────────────────────────────────── */

  /**
   * On protocol pages:
   *   1. Mobile TOC toggle (expand/collapse)
   *   2. Active heading highlighting on scroll
   */
  function initProtocolToc() {
    var tocAside = document.querySelector('.protocol-toc');
    if (!tocAside) return;

    // Mobile toggle
    var toggleBtn = tocAside.querySelector('.protocol-toc__toggle');
    var tocNav    = document.getElementById('toc-list');

    if (toggleBtn && tocNav) {
      toggleBtn.addEventListener('click', function () {
        var isOpen = tocNav.classList.toggle('is-open');
        toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    // Active heading highlighting via IntersectionObserver
    var tocLinks = tocAside.querySelectorAll('.protocol-toc__list a');
    if (!tocLinks.length || !('IntersectionObserver' in window)) return;

    var headingEls = [];
    var linkMap = {};
    tocLinks.forEach(function (link) {
      var id = link.getAttribute('href');
      if (id && id.startsWith('#')) {
        var target = document.getElementById(id.slice(1));
        if (target) {
          headingEls.push(target);
          linkMap[id.slice(1)] = link;
        }
      }
    });

    if (!headingEls.length) return;

    var currentActive = null;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (currentActive) currentActive.classList.remove('toc-active');
          var link = linkMap[entry.target.id];
          if (link) {
            link.classList.add('toc-active');
            currentActive = link;
          }
        }
      });
    }, {
      rootMargin: '-80px 0px -70% 0px',
      threshold: 0
    });

    headingEls.forEach(function (el) { observer.observe(el); });
  }

  /* ─── Projects Submenu ─────────────────────────────────────────────────────── */

  /**
   * The Projects nav item is a link plus a menu. CSS already opens the menu on
   * hover and focus-within, which covers mouse and keyboard on the desktop.
   * This adds the two things CSS cannot do:
   *   1. An explicit toggle, so touch devices (no hover) can open the list
   *      while tapping the label itself still goes to the projects catalogue.
   *   2. Escape / outside-click dismissal once it has been opened that way.
   */
  function initProjectsSubmenu() {
    var toggles = document.querySelectorAll('.site-nav__submenu-toggle');
    if (!toggles.length) return;

    var pairs = [];

    function closeAll(focusToggle) {
      pairs.forEach(function (pair) {
        if (pair.menu.classList.contains('is-open')) {
          pair.menu.classList.remove('is-open');
          pair.btn.setAttribute('aria-expanded', 'false');
          if (focusToggle) pair.btn.focus();
        }
      });
    }

    toggles.forEach(function (btn) {
      var menuId = btn.getAttribute('aria-controls');
      var menu = menuId ? document.getElementById(menuId) : null;
      if (!menu) return;

      pairs.push({ btn: btn, menu: menu });

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var isOpen = menu.classList.contains('is-open');
        closeAll(false);
        if (!isOpen) {
          menu.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    if (!pairs.length) return;

    // Clicking anywhere outside the item closes it. Clicks inside are left
    // alone so that following a project link is never swallowed.
    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.site-nav__has-menu')) {
        closeAll(false);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var anyOpen = pairs.some(function (pair) {
        return pair.menu.classList.contains('is-open');
      });
      if (anyOpen) closeAll(true);
    });
  }

  /* ─── Bilingual document position ──────────────────────────────────────────── */

  /**
   * The survival manual exists in two languages with an identical section
   * order, so heading N is the same section in both. Headings carry that
   * ordinal as data-seq, which lets the language switch hand the reader over
   * at the section they were actually reading instead of dumping them back at
   * the top of a 9,000-line document.
   *
   * No-ops on every page that has no such document.
   */
  function initDocLanguageSwitch() {
    var headings = document.querySelectorAll('[data-seq]');
    if (!headings.length) return;

    // Arriving from the other language: #s<N> is resolved against data-seq.
    var arriving = /^#s(\d+)$/.exec(window.location.hash || '');
    if (arriving) {
      var target = document.querySelector('[data-seq="' + arriving[1] + '"]');
      if (target) target.scrollIntoView();
    }

    var link = document.getElementById('lang-switch');
    if (!link) return;

    link.addEventListener('click', function () {
      var seq = null;
      for (var i = 0; i < headings.length; i++) {
        if (headings[i].getBoundingClientRect().top <= 90) {
          seq = headings[i].getAttribute('data-seq');
        } else {
          break;
        }
      }
      var base = link.getAttribute('href').split('#')[0];
      link.setAttribute('href', seq ? base + '#s' + seq : base);
    });
  }

  /* ─── Init ────────────────────────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    initIntroSequence();
    initInterstitial();

    initProtocolToc();

    initDocLanguageSwitch();
  });

}());
