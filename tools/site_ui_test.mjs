/** Browser regression tests of the site interface (2026-11-18). No npm install, no external traffic by default.
 *   PW_DIR=<dir with node_modules/playwright[-core]> CHROME=<chrome> node tools/site_ui_test.mjs [--base URL] [--shots DIR]
 * Without --base the repository's website/ is served on 127.0.0.1. With --base https://dikenocracy.com the deployed
 * site is tested (read-only: no form is submitted).
 * Covers: data-driven protocol counts; archive "Current view"/"Classic view" (mouse, keyboard, touch, persistence,
 * storage unavailable, anchors, search, layer filter, links, phone width); the Projects menu hover corridor (slow
 * pointer along the left, centre and right edges and diagonally), keyboard, Escape, focus exit and touch; button labels
 * readable before interaction (default, hover, focus) on representative pages.
 */
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const req = createRequire(process.env.PW_DIR ? path.join(process.env.PW_DIR, 'noop.js') : import.meta.url);
let chromium;
for (const name of ['playwright', 'playwright-core']) { try { ({ chromium } = req(name)); break; } catch {} }
if (!chromium) { console.log(JSON.stringify({ ok: false, error: 'Playwright unavailable; set PW_DIR' })); process.exit(1); }
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const shots = arg('--shots');
if (shots) await fs.mkdir(shots, { recursive: true });
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../website');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
let base = arg('--base'), server = null;
if (!base) {
  server = http.createServer(async (rq, rs) => {
    let p = path.join(root, decodeURIComponent(new URL(rq.url, 'http://x').pathname));
    if (!p.startsWith(root)) { rs.writeHead(403); rs.end(); return; }
    try { if ((await fs.stat(p)).isDirectory()) p = path.join(p, 'index.html'); rs.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); rs.end(await fs.readFile(p)); }
    catch { rs.writeHead(404); rs.end('not found'); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
}
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true });
for (const k of ['newContext', 'newPage']) {                  // fail fast: a missing control is a failed check, not a hang
  const orig = browser[k].bind(browser);
  browser[k] = async (...a) => { const x = await orig(...a); x.setDefaultTimeout(8000); return x; };
}
const results = [];
const check = async (name, fn) => { try { await fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, error: String(e && e.message || e).slice(0, 400) }); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const snap = async (page, name) => { if (shots) await page.screenshot({ path: path.join(shots, name + '.png') }); };
let catalog;
try { catalog = await (await fetch(base + '/pages/protocols/catalog.json')).json(); }
catch { catalog = JSON.parse(await fs.readFile(path.join(root, 'pages/protocols/catalog.json'), 'utf8')); results.push({ name: 'note: catalog.json not served by ' + base + '; repository catalog used', ok: true }); }

try {
  // ── 1. Counts ────────────────────────────────────────────────────────────────
  await check('counts: home page markers equal the catalog', async () => {
    const page = await browser.newPage();
    await page.goto(base + '/index.html');
    const marks = await page.$$eval('[data-count]', (els) => els.map((e) => [e.dataset.count, e.textContent.trim()]));
    assert(marks.length >= 11, 'markers: ' + marks.length);
    for (const [key, text] of marks) {
      const n = key === 'protocols' ? catalog.counts.protocols : catalog.counts.layers[key.split(':')[1]];
      assert(parseInt(text, 10) === n, `${key}: ${text} != ${n}`);
    }
    await page.close();
  });

  // ── 2. Archive views ─────────────────────────────────────────────────────────
  const archive = base + '/pages/protocols.html';
  const visibleView = (page) => page.evaluate(() => ({
    current: !!document.querySelector('[data-archive-view="current"]').getClientRects().length,
    classic: !!document.querySelector('[data-archive-view="classic"]').getClientRects().length,
    pressed: [...document.querySelectorAll('[data-archive-choose]')].map((b) => b.getAttribute('aria-pressed')).join(','),
    ids: [...document.querySelectorAll('[id$="-heading"][data-anchor]')].map((e) => e.closest('[data-archive-view]').dataset.archiveView),
  }));
  for (const width of [1280, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(archive);
    await check(`${width}: archive defaults to the current view, switcher visible`, async () => {
      const v = await visibleView(page);
      assert(v.current && !v.classic && v.pressed === 'true,false', JSON.stringify(v));
      assert(await page.isVisible('[data-archive-switch]'), 'switcher hidden');
      assert(new Set(v.ids).size === 1 && v.ids[0] === 'current', 'anchors not on the current view');
    });
    await snap(page, `archive-current-${width}`);
    await check(`${width}: both views list the same catalog with working links`, async () => {
      const lists = await page.evaluate(() => ({
        current: [...document.querySelectorAll('[data-archive-view="current"] .proto-row a')].map((a) => a.getAttribute('href')),
        classic: [...document.querySelectorAll('[data-archive-view="classic"] .c-protocol-layer')].map((a) => a.getAttribute('href')),
        map: [...document.querySelectorAll('[data-archive-view="classic"] .c-protocol-map a')].map((a) => a.getAttribute('href')),
      }));
      const want = catalog.documents.map((d) => 'protocols/' + d.slug + '.html').sort();
      for (const k of ['current', 'classic', 'map']) assert(JSON.stringify([...lists[k]].sort()) === JSON.stringify(want), k + ' list differs');
      if (width === 1280) for (const href of want) { const r = await page.request.get(new URL(href, archive).href); assert(r.ok(), href + ' ' + r.status()); }
    });
    await page.click('[data-archive-choose="classic"]').catch(() => {});
    await check(`${width}: mouse switches to the classic view; anchors move; choice stored`, async () => {
      const v = await visibleView(page);
      assert(!v.current && v.classic && v.pressed === 'false,true', JSON.stringify(v));
      assert(new Set(v.ids).size === 1 && v.ids[0] === 'classic', 'anchors not moved');
      assert(await page.evaluate(() => localStorage.getItem('dkp-archive-view')) === 'classic', 'not stored');
      assert((await page.$$('[id="l3-heading"]')).length === 1, 'duplicate id');
    });
    await snap(page, `archive-classic-${width}`);
    await check(`${width}: classic counts, search and layer filter`, async () => {
      const total = await page.$$eval('[data-archive-view="classic"] .c-protocol-layer', (e) => e.length);
      assert(total === catalog.counts.documents, 'cards ' + total);
      await page.fill('[data-classic-search]', 'justice');
      assert(await page.$$eval('[data-archive-view="classic"] .c-protocol-layer:not([hidden])', (e) => e.length) === 1, 'search');
      await page.fill('[data-classic-search]', '');
      await page.selectOption('[data-classic-layer]', 'L3');
      assert(await page.$$eval('[data-archive-view="classic"] .c-protocol-layer:not([hidden])', (e) => e.length) === catalog.counts.layers.L3, 'layer filter');
      await page.selectOption('[data-classic-layer]', '');
      assert((await page.textContent('[data-classic-count]')).startsWith(String(catalog.counts.documents)), 'count text');
    });
    await check(`${width}: no horizontal overflow in the classic view`, async () => {
      assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'overflow');
    });
    await check(`${width}: preference survives reload; shared anchor opens in the classic view`, async () => {
      await page.goto('about:blank');                  // a real load, not a same-document hash change
      await page.goto(archive + '#l5-heading');
      await page.waitForLoadState('load');
      await page.waitForTimeout(400);
      const v = await visibleView(page);
      assert(v.classic && !v.current, 'not classic after reload');
      const box = await page.evaluate(() => { const r = document.getElementById('l5-heading').getBoundingClientRect(); return { top: r.top, inClassic: !!document.getElementById('l5-heading').closest('.archive-classic') }; });
      assert(box.inClassic && box.top < 300 && box.top > -400, 'anchor ' + JSON.stringify(box));
    });
    await check(`${width}: keyboard switches back (Tab + Enter, Space)`, async () => {
      await page.focus('[data-archive-choose="current"]');
      await page.keyboard.press('Enter');
      assert((await visibleView(page)).current, 'Enter');
      await page.focus('[data-archive-choose="classic"]');
      await page.keyboard.press('Space');
      assert((await visibleView(page)).classic, 'Space');
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Enter');
      assert((await visibleView(page)).current, 'Shift+Tab Enter');
    });
    await check(`${width}: current view search and layer filter still work`, async () => {
      await page.fill('[data-explorer-search]', 'justice');
      assert(await page.$$eval('[data-archive-view="current"] .proto-row:not([hidden])', (e) => e.length) === 1, 'search');
      await page.fill('[data-explorer-search]', '');
    });
    await ctx.close();
  }
  await check('touch: tapping switches views', async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto(archive);
    await page.tap('[data-archive-choose="classic"]');
    assert((await visibleView(page)).classic, 'tap classic');
    await page.tap('[data-archive-choose="current"]');
    assert((await visibleView(page)).current, 'tap current');
    await ctx.close();
  });
  await check('storage unavailable: archive loads usable in the current view and still switches', async () => {
    const ctx = await browser.newContext();
    await ctx.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } }); });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(archive);
    assert((await visibleView(page)).current, 'default view');
    await page.click('[data-archive-choose="classic"]');
    assert((await visibleView(page)).classic, 'switch');
    assert(!errors.length, errors.join(';'));
    await ctx.close();
  });
  await check('no JavaScript: current view complete, classic hidden, no duplicate ids', async () => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(archive);
    const r = await page.evaluate(() => ({ rows: document.querySelectorAll('.proto-row').length,
      classicShown: !!document.querySelector('.archive-classic').getClientRects().length,
      dup: [...document.querySelectorAll('[id]')].map((e) => e.id).filter((id, i, a) => a.indexOf(id) !== i) }));
    assert(r.rows === catalog.counts.documents && !r.classicShown && !r.dup.length, JSON.stringify(r));
    await ctx.close();
  });

  // ── 3. Projects menu ─────────────────────────────────────────────────────────
  for (const pagePath of ['/index.html', '/pages/protocols.html', '/converter/index.html']) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(base + pagePath);
    await page.waitForTimeout(200);
    const geo = async () => page.evaluate(() => {
      const item = document.querySelector('.site-nav__has-menu').getBoundingClientRect();
      const menu = document.querySelector('.site-nav__submenu');
      const m = menu.hidden ? null : menu.getBoundingClientRect();
      return { item: { l: item.left, r: item.right, t: item.top, b: item.bottom }, menu: m && { l: m.left, r: m.right, t: m.top, b: m.bottom } };
    });
    const isOpen = () => page.evaluate(() => !document.querySelector('.site-nav__submenu').hidden);
    for (const [label, fx, tx] of [['left edge', 0.08, 'menuLeft'], ['centre', 0.5, 'menuCentre'], ['right edge', 0.92, 'menuRight'], ['diagonal', 0.1, 'menuFarLeft']]) {
      await check(`${pagePath}: slow pointer from Projects to the menu (${label}) keeps it open`, async () => {
        await page.mouse.move(5, 500);
        await page.waitForTimeout(350);
        const g0 = await geo();
        const sx = g0.item.l + (g0.item.r - g0.item.l) * fx, sy = (g0.item.t + g0.item.b) / 2;
        await page.mouse.move(sx, sy, { steps: 5 });
        await page.waitForTimeout(150);
        assert(await isOpen(), 'not opened by hover');
        const g = await geo();
        const ty = g.menu.t + 18;
        const target = { menuLeft: g.menu.l + 12, menuCentre: (g.menu.l + g.menu.r) / 2, menuRight: g.menu.r - 12, menuFarLeft: g.menu.l + 8 }[tx];
        const steps = 40;
        for (let i = 1; i <= steps; i++) {               // ~40 x 25 ms: a slow, ordinary movement
          await page.mouse.move(sx + (target - sx) * i / steps, sy + (ty - sy) * i / steps);
          await page.waitForTimeout(25);
          assert(await isOpen(), `closed at step ${i}/${steps}`);
        }
        await page.waitForTimeout(400);
        assert(await isOpen(), 'closed after arriving');
      });
    }
    await check(`${pagePath}: leaving the menu closes it; clicking a menu link navigates`, async () => {
      await page.mouse.move(5, 600, { steps: 4 });
      await page.waitForTimeout(500);
      assert(!(await isOpen()), 'still open after leaving');
      const g = await geo();
      await page.mouse.move((g.item.l + g.item.r) / 2, (g.item.t + g.item.b) / 2, { steps: 3 });
      await page.waitForTimeout(150);
      const link = page.locator('.site-nav__submenu a').first();
      const href = await link.getAttribute('href');
      await Promise.all([page.waitForURL((u) => u.pathname.replace(/index\.html$/, '') === new URL(href, base).pathname.replace(/index\.html$/, ''), { timeout: 5000 }), link.click()]);
      await page.waitForTimeout(200);
      assert(!(await isOpen()), 'menu open after navigation');
    });
    await ctx.close();
  }
  await check('keyboard: focus opens, ArrowDown enters, Escape closes, Tab out closes', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(base + '/index.html');
    await page.focus('.site-nav__parent > a');
    assert(await page.evaluate(() => !document.querySelector('.site-nav__submenu').hidden), 'focus did not open');
    await page.keyboard.press('ArrowDown');
    assert(await page.evaluate(() => document.activeElement.closest('.site-nav__submenu') !== null), 'ArrowDown');
    await page.keyboard.press('Escape');
    assert(await page.evaluate(() => document.querySelector('.site-nav__submenu').hidden && document.activeElement.classList.contains('site-nav__submenu-toggle')), 'Escape');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    assert(await page.evaluate(() => document.querySelector('.site-nav__submenu').hidden || document.activeElement.closest('.site-nav__has-menu')), 'focus exit');
    await page.close();
  });
  await check('touch (phone): toggle opens, link navigates, outside tap closes', async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto(base + '/pages/about.html');
    await page.tap('.site-nav__submenu-toggle');
    assert(await page.isVisible('.site-nav__submenu'), 'tap did not open');
    await page.touchscreen.tap(195, 820);             // a point the open menu does not cover
    await page.waitForTimeout(150);
    assert(!(await page.isVisible('.site-nav__submenu')), 'outside tap did not close');
    await page.tap('.site-nav__submenu-toggle');
    const href = await page.locator('.site-nav__submenu a').first().getAttribute('href');
    await Promise.all([page.waitForURL((u) => u.pathname.replace(/index\.html$/, '') === new URL(href, base).pathname.replace(/index\.html$/, '')), page.tap('.site-nav__submenu a >> nth=0')]);
    await ctx.close();
  });

  // ── 4. Button labels ─────────────────────────────────────────────────────────
  const contrast = () => {
    const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
    const lum = ({ r, g, b }) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    window.__dkpContrast = (el) => {
      const stack = []; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.backgroundImage !== 'none' && e !== el) return null; const c = parse(s.backgroundColor); if (c.a > 0) { stack.push(c); if (c.a >= 1) break; } }
      let bg = { r: 255, g: 255, b: 255 }; for (const c of stack.reverse()) bg = { r: c.r * c.a + bg.r * (1 - c.a), g: c.g * c.a + bg.g * (1 - c.a), b: c.b * c.a + bg.b * (1 - c.a) };
      const fg = parse(getComputedStyle(el).color); const a = lum(fg), b = lum(bg);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
  };
  for (const p of ['/index.html', '/pages/about.html', '/pages/projects.html', '/pages/protocols.html', '/converter/index.html', '/pages/protocols/dkp-1-justice-001.html']) {
    for (const width of [1280, 390]) {
      await check(`${p} @${width}: every button label readable in default, hover and focus states`, async () => {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.addInitScript(contrast);
        await page.goto(base + p);
        await page.waitForTimeout(250);
        const sel = 'a.btn, button, .site-nav__action, [role="button"], input[type="submit"], .btn-convert';
        const n = await page.$$eval(sel, (els) => els.length);
        const bad = [];
        for (let i = 0; i < n; i++) {
          const el = page.locator(sel).nth(i);
          if (!(await el.isVisible())) continue;
          const text = ((await el.innerText()) || '').trim();
          if (!text) continue;
          const def = await el.evaluate((e) => window.__dkpContrast(e));
          if (def !== null && def < 3) bad.push(`${text}: default ${def.toFixed(2)}`);
          if (width === 1280) {
            await el.hover({ force: true }).catch(() => {});
            const hov = await el.evaluate((e) => window.__dkpContrast(e));
            if (hov !== null && hov < 3) bad.push(`${text}: hover ${hov.toFixed(2)}`);
            await page.mouse.move(2, 880);
          }
          await el.focus();
          const ring = await el.evaluate((e) => { const s = getComputedStyle(e); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 || s.boxShadow !== 'none'; });
          const kb = await el.evaluate((e) => e.matches(':focus-visible'));
          if (kb && !ring) bad.push(`${text}: no focus indicator`);
        }
        await page.close();
        assert(!bad.length, bad.slice(0, 6).join(' | '));
      });
    }
  }
  await check('converter: the Convert label is visible before interaction', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.addInitScript(contrast);
    await page.goto(base + '/converter/index.html');
    const r = await page.$eval('#btn-g2d', (e) => ({ ratio: window.__dkpContrast(e), color: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor }));
    await snap(page, 'converter-1280');
    assert(r.ratio >= 4.5, JSON.stringify(r));
    await page.close();
  });
} finally { await browser.close(); if (server) server.close(); }
const ok = results.every((r) => r.ok);
console.log(JSON.stringify({ ok, base, passed: results.filter((r) => r.ok).length, total: results.length, failed: results.filter((r) => !r.ok) }, null, 1));
process.exit(ok ? 0 : 1);
