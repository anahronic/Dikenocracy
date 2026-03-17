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

  /* ─── Init ────────────────────────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    initIntroSequence();
    initMobileNav();
  });

}());
