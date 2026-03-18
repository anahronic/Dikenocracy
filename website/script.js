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
  var FADE_DURATION_MS  = 800;    // must match CSS --fade transition duration

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

  /* ─── Init ────────────────────────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    initIntroSequence();
    initMobileNav();
    initProtocolToc();
  });

}());
