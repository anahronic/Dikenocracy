/**
 * Dikenocracy — i18n Loader
 * i18n.js
 *
 * Responsibilities:
 *   1. Detect language from ?lang= query parameter (default: en)
 *   2. Load shared UI labels (ui_labels.json)
 *   3. Load per-protocol translations (i18n/protocols/<name>.json)
 *   4. Apply translations to the DOM
 *   5. Render the language switcher
 *   6. Set document direction (RTL for he, ar)
 *
 * Architecture:
 *   - Single HTML source per protocol page (English canonical)
 *   - Translations overlay via DOM manipulation
 *   - All translatable elements use data-i18n="<key>" attributes
 *   - Protocol article content replaced from translation JSON
 *
 * No external dependencies.
 */

(function () {
  'use strict';

  /* ─── Constants ──────────────────────────────────────────────────────────── */

  var SUPPORTED_LANGS = ['en', 'ru', 'he', 'ar', 'zh', 'es', 'fr', 'de', 'it', 'pt'];
  var RTL_LANGS       = ['he', 'ar'];
  var DEFAULT_LANG    = 'en';

  /* Resolve base path to website root (i18n/ lives at root) */
  var scriptEl   = document.currentScript;
  var scriptSrc  = scriptEl ? scriptEl.getAttribute('src') : '';
  var BASE_PATH  = scriptSrc.replace(/i18n\.js$/, '');

  /* ─── State ──────────────────────────────────────────────────────────────── */

  var currentLang = DEFAULT_LANG;
  var uiLabels    = null;
  var protocolTranslations = null;

  /* ─── Utilities ──────────────────────────────────────────────────────────── */

  function getLangFromURL() {
    var params = new URLSearchParams(window.location.search);
    var lang   = (params.get('lang') || '').toLowerCase();
    return SUPPORTED_LANGS.indexOf(lang) !== -1 ? lang : DEFAULT_LANG;
  }

  function fetchJSON(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
      return res.json();
    });
  }

  /**
   * Derive protocol slug from the current page filename.
   * e.g. "dkp-1-axioms-001.html" → "dkp-1-axioms-001"
   * Returns null if not on a protocol page.
   */
  function getProtocolSlug() {
    var path = window.location.pathname;
    var match = path.match(/\/pages\/protocols\/([^\/]+)\.html/);
    if (!match) return null;
    return match[1];
  }

  function isRTL(lang) {
    return RTL_LANGS.indexOf(lang) !== -1;
  }

  /* ─── Language Switcher ──────────────────────────────────────────────────── */

  function buildLanguageSwitcher() {
    var toolbar = document.querySelector('.protocol-toolbar');
    if (!toolbar) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'lang-switcher';

    var btn = document.createElement('button');
    btn.className = 'lang-switcher__btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-label', 'Select language');

    var currentName = uiLabels && uiLabels.language_name
      ? (uiLabels.language_name[currentLang] || currentLang.toUpperCase())
      : currentLang.toUpperCase();
    btn.innerHTML = '<span class="lang-switcher__icon">&#127760;</span> ' +
                    '<span class="lang-switcher__current">' + currentName + '</span>';

    var dropdown = document.createElement('ul');
    dropdown.className = 'lang-switcher__dropdown';
    dropdown.setAttribute('role', 'listbox');
    dropdown.setAttribute('aria-label', 'Languages');

    SUPPORTED_LANGS.forEach(function (lang) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      if (lang === currentLang) {
        li.setAttribute('aria-selected', 'true');
        li.classList.add('lang-switcher__item--active');
      }

      var a = document.createElement('a');
      /* Preserve current URL, only change ?lang= */
      var url = new URL(window.location.href);
      if (lang === DEFAULT_LANG) {
        url.searchParams.delete('lang');
      } else {
        url.searchParams.set('lang', lang);
      }
      a.href = url.toString();
      a.className = 'lang-switcher__link';

      var nativeName = uiLabels && uiLabels.language_name
        ? (uiLabels.language_name[lang] || lang.toUpperCase())
        : lang.toUpperCase();

      a.textContent = nativeName;
      li.appendChild(a);
      dropdown.appendChild(li);
    });

    /* Toggle dropdown */
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = wrapper.classList.toggle('lang-switcher--open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    /* Close on outside click */
    document.addEventListener('click', function () {
      wrapper.classList.remove('lang-switcher--open');
      btn.setAttribute('aria-expanded', 'false');
    });

    /* Close on Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        wrapper.classList.remove('lang-switcher--open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(dropdown);
    toolbar.appendChild(wrapper);
  }

  /* ─── Apply UI Labels ────────────────────────────────────────────────────── */

  function applyUILabels() {
    if (!uiLabels || currentLang === DEFAULT_LANG) return;

    /* Generic data-i18n attribute — finds elements with data-i18n="<key>" */
    var i18nEls = document.querySelectorAll('[data-i18n]');
    i18nEls.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (uiLabels[key] && uiLabels[key][currentLang]) {
        el.textContent = uiLabels[key][currentLang];
      }
    });

    /* data-i18n-html — same but sets innerHTML (for labels with HTML entities) */
    var htmlEls = document.querySelectorAll('[data-i18n-html]');
    htmlEls.forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (uiLabels[key] && uiLabels[key][currentLang]) {
        el.innerHTML = uiLabels[key][currentLang];
      }
    });

    /* data-i18n-aria — sets aria-label */
    var ariaEls = document.querySelectorAll('[data-i18n-aria]');
    ariaEls.forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (uiLabels[key] && uiLabels[key][currentLang]) {
        el.setAttribute('aria-label', uiLabels[key][currentLang]);
      }
    });

    /* Protocol map layer labels */
    var layerLabels = document.querySelectorAll('[data-i18n-layer]');
    layerLabels.forEach(function (el) {
      var key = el.getAttribute('data-i18n-layer');
      if (uiLabels[key] && uiLabels[key][currentLang]) {
        el.textContent = uiLabels[key][currentLang];
      }
    });
  }

  /* ─── Apply Protocol Translation ──────────────────────────────────────────── */

  function applyProtocolTranslation() {
    if (!protocolTranslations || currentLang === DEFAULT_LANG) return;

    var langData = protocolTranslations.translations
      ? protocolTranslations.translations[currentLang]
      : null;
    if (!langData) return;

    /* Replace protocol article content */
    var article = document.querySelector('.protocol-article');
    if (article && langData.article_html) {
      article.innerHTML = langData.article_html;
    }

    /* Replace TOC entries */
    var tocList = document.querySelector('.protocol-toc__list');
    if (tocList && langData.toc) {
      tocList.innerHTML = '';
      langData.toc.forEach(function (item) {
        var li = document.createElement('li');
        if (item.sub) li.className = 'toc__sub';
        var a = document.createElement('a');
        a.href = '#' + item.id;
        a.textContent = item.text;
        li.appendChild(a);
        tocList.appendChild(li);
      });
    }

    /* Replace page title */
    if (langData.page_title) {
      document.title = langData.page_title;
    }

    /* Replace meta description */
    if (langData.meta_description) {
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', langData.meta_description);
    }
  }

  /* ─── Set Document Direction ──────────────────────────────────────────────── */

  function applyDirection() {
    var html = document.documentElement;
    if (isRTL(currentLang)) {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', currentLang);
      document.body.classList.add('is-rtl');
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', currentLang);
      document.body.classList.remove('is-rtl');
    }
  }

  /* ─── Initialize ──────────────────────────────────────────────────────────── */

  function init() {
    currentLang = getLangFromURL();

    /* Set direction immediately to prevent layout flash */
    applyDirection();

    /* Load UI labels (always needed for language switcher) */
    var labelsURL = BASE_PATH + 'i18n/ui_labels.json';
    var labelsPromise = fetchJSON(labelsURL).then(function (data) {
      uiLabels = data;
    }).catch(function (err) {
      console.warn('[i18n] Could not load ui_labels.json:', err.message);
    });

    /* Load protocol translations if on a protocol page and not EN */
    var slug = getProtocolSlug();
    var protoPromise;
    if (slug && currentLang !== DEFAULT_LANG) {
      var protoURL = BASE_PATH + 'i18n/protocols/' + slug + '.json';
      protoPromise = fetchJSON(protoURL).then(function (data) {
        protocolTranslations = data;
      }).catch(function (err) {
        console.warn('[i18n] No translation file for ' + slug + ':', err.message);
      });
    } else {
      protoPromise = Promise.resolve();
    }

    /* Wait for both and apply */
    Promise.all([labelsPromise, protoPromise]).then(function () {
      applyUILabels();
      applyProtocolTranslation();
      buildLanguageSwitcher();
    });
  }

  /* Run on DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
