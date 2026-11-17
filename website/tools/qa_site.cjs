// Site QA for the redesign: content integrity of the protocol pages, every page at three widths, accessibility.
//   AXE=<path to axe.min.js> node website/tools/qa_site.cjs http://127.0.0.1:8765 <out_dir>
// Needs Playwright from E:/dikenocracy-work/tooling. AXE is optional (axe-core 4.10.x); without it the a11y part is skipped.
const { chromium } = require('E:/dikenocracy-work/tooling/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const base = (process.argv[2] || 'http://127.0.0.1:8765').replace(/\/$/, '');
const out = process.argv[3] || '.';
const SITE = path.resolve(__dirname, '..');
fs.mkdirSync(out, { recursive: true });
const results = [];
const ok = (name, pass, detail) => results.push({ name, pass: !!pass, detail });

const slugs = fs.readFileSync(path.join(SITE, 'pages/protocols/manifest.txt'), 'utf8').trim().split('\n').map(l => l.split('\t'));
const PAGES = ['/', '/pages/about.html', '/pages/projects.html', '/pages/protocols.html', '/pages/converter.html',
  '/converter/index.html', '/404.html',
  '/pages/protocols/code-of-planetary-synergy.html', '/pages/protocols/dkp-1-axioms-001.html', '/pages/protocols/dkp-0-time-001.html',
  '/pages/protocols/dkp-1-prevention-001.html', '/pages/protocols/appendix-a-design-rationale-safeguards-normative.html'];

(async () => {
  const b = await chromium.launch({ channel: 'msedge' });
  const copyOf = (p, sel) => p.evaluate((s) => {
    const el = document.querySelector(s); const r = document.createRange(); r.selectNodeContents(el);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); const t = sel.toString(); sel.removeAllRanges(); return t;
  }, sel);

  // 1. Content integrity (ported from release/browser_check.cjs, selectors updated to the new markup)
  {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(base + '/pages/protocols/code-of-planetary-synergy.html', { waitUntil: 'load' });
    const fCopy = (await copyOf(p, '.formula')).trim();
    ok('code: formula copy', fCopy === 'dW/dt ≥ k · E(t) · T(t) · B(t)^2.83', fCopy);
    const art = await copyOf(p, 'article');
    for (const s of ['RTK-GPS (±2 cm)', 'B_min = 0.68 - Hard threshold; if B(t) < B_min, all Kill Switches activate simultaneously.',
      'Weight ≤ 10%', '≥ 28,000 LEO satellites', '(≈2031–2032)', '"B_min": 0.68,', 'Last updated: 2026-10-04'])
      ok('code: contains ' + s, art.includes(s));
    await p.goto(base + '/pages/protocols/dkp-0-time-001.html', { waitUntil: 'load' });
    const py = await copyOf(p, 'pre code');
    ok('time: code block copies intact', py.includes('def gregorian_to_jdn') && py.includes('    m = month + 12 * a - 3'));
    ok('time: 6.2 steps', (await p.locator('[id="62-dikenocratic-gregorian"] + p + ol > li').count()) === 3);
    await p.goto(base + '/pages/protocols/dkp-0-oracle-001.html', { waitUntil: 'load' });
    ok('oracle: < 60% cell', (await p.locator('td', { hasText: '60%' }).first().innerText()).trim() === '< 60%');
    await p.goto(base + '/pages/protocols/dkp-7-privacy-001.html', { waitUntil: 'load' });
    ok('privacy: lists present', (await p.locator('article ul').count()) >= 12);
    await p.goto(base + '/pages/protocols.html', { waitUntil: 'load' });
    const ids = await p.locator('.proto-row__id').allInnerTexts();
    const protos = ids.filter(i => i.startsWith('DKP-') && !i.includes('PATCH'));
    ok('index: 35 unique protocols listed', protos.length === 35 && new Set(protos).size === 35, protos.length);
    ok('index: 38 documents listed', ids.length === 38, ids.length);
    await p.fill('[data-explorer-search]', 'justice');
    const vis = await p.locator('.proto-row:not([hidden])').count();
    ok('index: search filters (justice)', vis >= 1 && vis < 38, vis);
    await p.fill('[data-explorer-search]', '');
    await p.click('[data-layer-filter="L3"]');
    ok('index: layer filter L3 shows 4', (await p.locator('.proto-row:not([hidden])').count()) === 4);
    await p.click('[data-layer-filter="all"]');
    // Prev/next chain and dated meta on every document
    const bad = [];
    for (let i = 0; i < slugs.length; i++) {
      const [slug, id] = slugs[i];
      await p.goto(`${base}/pages/protocols/${slug}.html`, { waitUntil: 'domcontentloaded' });
      const prev = await p.locator('.protocol-nav-bottom a[rel="prev"]').getAttribute('href').catch(() => null);
      const next = await p.locator('.protocol-nav-bottom a[rel="next"]').getAttribute('href').catch(() => null);
      if ((i ? slugs[i - 1][0] + '.html' : null) !== prev || (i + 1 < slugs.length ? slugs[i + 1][0] + '.html' : null) !== next) bad.push('chain:' + slug);
      if (!(await p.locator('.protocol-meta').innerText()).includes('Last updated: 2026-10-04')) bad.push('meta:' + slug);
      if ((await p.locator('article h1').innerText()).trim() !== id) bad.push('h1:' + slug);
      const missing = await p.evaluate(() => [...document.querySelectorAll('.protocol-toc__list a')].map(a => a.getAttribute('href').slice(1)).filter(h => !document.getElementById(h)));
      if (missing.length) bad.push('toc:' + slug + ':' + missing.join(','));
      if ((await p.locator('.doc-layer a[aria-current="page"]').count()) !== 1) bad.push('rail:' + slug);
    }
    ok('documents: prev/next chain, dated meta, h1 = id, contents anchors, rail current item', bad.length === 0, bad);
    await ctx.close();
  }

  // 2. Every page at three widths: errors, overflow, broken images, local fragment links, touch targets on phones
  for (const [label, vp, mobile] of [['1440', { width: 1440, height: 900 }, false], ['768', { width: 768, height: 1024 }, true], ['390', { width: 390, height: 844 }, true]]) {
    const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile });
    for (const url of PAGES) {
      const p = await ctx.newPage(); const errs = [];
      p.on('pageerror', e => errs.push(String(e)));
      p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      p.on('response', r => { if (r.status() >= 400 && !/favicon|cdn-cgi/.test(r.url()) && !url.includes('404')) errs.push(r.status() + ' ' + r.url()); });
      await p.goto(base + url, { waitUntil: 'load' });
      await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } window.scrollTo(0, 0); });
      await p.waitForTimeout(300);
      const r = await p.evaluate(() => {
        const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        const brokenImgs = [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src'));
        const badFrag = [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)).filter(h => h && !document.getElementById(h));
        const small = innerWidth < 600 ? [...document.querySelectorAll('main a, main button, nav a, nav button, input, select')]
          .filter(e => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false; const q = e.getBoundingClientRect(); return q.width > 0 && q.height > 0 && q.height < 24 && !e.closest('p, li, td, dd, .protocol-article, .prose'); })
          .map(e => (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30)) : [];
        return { overflow, brokenImgs, badFrag: [...new Set(badFrag)], small };
      });
      const tag = `${label} ${url}`;
      ok(`${tag}: no errors`, errs.length === 0, errs.slice(0, 4));
      ok(`${tag}: no horizontal scroll`, r.overflow <= 1, r.overflow);
      ok(`${tag}: images load`, r.brokenImgs.length === 0, r.brokenImgs);
      ok(`${tag}: in-page links resolve`, r.badFrag.length === 0, r.badFrag.slice(0, 5));
      if (label === '390') ok(`${tag}: no tiny standalone controls (<24px)`, r.small.length === 0, r.small.slice(0, 6));
      await p.close();
    }
    await ctx.close();
  }

  // 3. Keyboard: the skip link is the first stop and moves focus to main
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(base + '/', { waitUntil: 'load' });
    await p.keyboard.press('Tab');
    const first = await p.evaluate(() => document.activeElement.className + '|' + getComputedStyle(document.activeElement).top);
    ok('keyboard: first Tab reaches the visible skip link', first.startsWith('skip-link') && !first.endsWith('-100px'), first);
    await p.keyboard.press('Enter');
    ok('keyboard: skip link jumps to #main', (await p.evaluate(() => location.hash)) === '#main');
    await p.goto(base + '/pages/projects.html', { waitUntil: 'load' });
    await p.focus('.site-nav__submenu-toggle'); await p.keyboard.press('Enter');
    ok('keyboard: projects submenu opens', !(await p.locator('#nav-projects-submenu').evaluate(e => e.hidden)));
    await p.keyboard.press('Escape');
    ok('keyboard: Escape closes it', await p.locator('#nav-projects-submenu').evaluate(e => e.hidden));
    await p.close();
  }

  // 4. axe-core (WCAG 2.2 AA rules)
  if (process.env.AXE && fs.existsSync(process.env.AXE)) {
    const axe = fs.readFileSync(process.env.AXE, 'utf8');
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    for (const url of PAGES) {
      await p.goto(base + url, { waitUntil: 'load' });
      await p.evaluate(axe);
      const v = await p.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] }))
        .violations.map(x => `${x.id} (${x.impact}) ×${x.nodes.length}: ${x.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | ')}`));
      ok(`axe ${url}`, v.length === 0, v);
    }
    await p.close();
  }

  await b.close();
  fs.writeFileSync(path.join(out, 'qa-results.json'), JSON.stringify(results, null, 1));
  const fails = results.filter(r => !r.pass);
  for (const r of fails) console.log('FAIL', r.name, JSON.stringify(r.detail).slice(0, 400));
  console.log(`${results.length - fails.length}/${results.length} checks passed`);
})();
