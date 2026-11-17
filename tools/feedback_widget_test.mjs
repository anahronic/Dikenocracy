/** Local-only browser test of the protocol feedback script (website/feedback/feedback-*.js).
 * No npm install and no external traffic: serves website/ on 127.0.0.1, answers /api/feedback/v1/submit itself.
 * Needs an existing playwright or playwright-core: PW_DIR=<dir containing node_modules> and, if no bundled browser,
 * CHROME=<path to chrome.exe>.   node tools/feedback_widget_test.mjs
 */
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const req = createRequire(process.env.PW_DIR ? path.join(process.env.PW_DIR, 'noop.js') : import.meta.url);
let chromium;
for (const name of ['playwright', 'playwright-core']) { try { ({ chromium } = req(name)); break; } catch {} }
if (!chromium) { console.log(JSON.stringify({ ok: false, error: 'Playwright unavailable; set PW_DIR' })); process.exit(1); }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../website');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png' };
const posts = [];
let reply = { code: 201, body: { ok: true, id: '0123456789abcdef', delivery: 'queued' } };
const server = http.createServer(async (rq, rs) => {
  const url = new URL(rq.url, 'http://127.0.0.1');
  if (url.pathname === '/api/feedback/v1/submit') {
    const chunks = []; for await (const c of rq) chunks.push(c);
    posts.push({ method: rq.method, headers: rq.headers, body: JSON.parse(Buffer.concat(chunks).toString() || 'null') });
    rs.writeHead(reply.code, { 'Content-Type': 'application/json' }); rs.end(JSON.stringify(reply.body)); return;
  }
  try {
    let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!file.startsWith(root)) throw new Error('outside');
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const data = await fs.readFile(file);
    rs.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); rs.end(data);
  } catch { rs.writeHead(404); rs.end('not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true });
const results = [];
const check = async (name, fn) => { try { await fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, error: String(e.message || e).slice(0, 300) }); } };
const select = page => page.evaluate(() => {
  const p = [...document.querySelectorAll('article h3[id] ~ p')].find(x => x.textContent.trim().length > 40);
  const r = document.createRange(); r.selectNodeContents(p); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  return p.textContent.trim().slice(0, 60);
});
try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/favicon|404|429/.test(m.text())) errors.push(m.text()); });
    await page.goto(origin + '/pages/protocols/dkp-5-work-cycle-001.html');
    await check(`${width}: script present once, no Keeper loader`, async () => {
      assert.equal(await page.locator('script[src^="/feedback/feedback-"]').count(), 1);
      assert.equal(await page.locator('script[src*="keeper"]').count(), 0);
      assert.equal(await page.locator('#dkp-feedback').count(), 1);
    });
    await check(`${width}: button hidden without selection`, async () => assert.equal(await page.locator('#dkp-feedback #fb').isVisible(), false));
    const quoted = await select(page);
    await check(`${width}: button appears for an article selection`, async () => page.locator('#dkp-feedback #fb').waitFor({ state: 'visible', timeout: 3000 }));
    await page.locator('#dkp-feedback #fb').click();
    await check(`${width}: dialog shows protocol, section and quote`, async () => {
      await page.locator('#dkp-feedback #fbd').waitFor({ state: 'visible', timeout: 3000 });
      const head = await page.locator('#dkp-feedback #fbm').textContent();
      assert.match(head, /^DKP-5-WORK-CYCLE-001( — .+)?$/);
      assert.ok((await page.locator('#dkp-feedback #fbq').textContent()).includes(quoted.slice(0, 30)));
      if (width < 600) { const box = await page.locator('#dkp-feedback #fbd').boundingBox(); assert.ok(box.width >= width - 2, 'full width on phones'); }
    });
    await check(`${width}: empty message is refused locally`, async () => {
      const before = posts.length; await page.locator('#dkp-feedback #fbsend').click();
      assert.match(await page.locator('#dkp-feedback #fbs').textContent(), /write your feedback/); assert.equal(posts.length, before);
    });
    await page.waitForTimeout(1200);                   // the service rejects instant submissions (too_fast)
    await page.locator('#dkp-feedback #fbmsg').fill('Test message <b>not html</b>');
    await check(`${width}: counter`, async () => assert.equal(await page.locator('#dkp-feedback #fbc').textContent(), '28 / 5000'));
    reply = { code: 201, body: { ok: true, id: '0123456789abcdef', delivery: 'queued' } };
    await page.locator('#dkp-feedback #fbsend').click();
    await check(`${width}: submission payload and thank-you text`, async () => {
      await page.locator('#dkp-feedback #fbs', { hasText: 'Thank you' }).waitFor({ timeout: 3000 });
      const p = posts.at(-1);
      assert.equal(p.method, 'POST'); assert.match(p.headers['content-type'], /application\/json/); assert.equal(p.headers.cookie, undefined);
      assert.equal(p.body.slug, 'dkp-5-work-cycle-001');
      assert.equal(p.body.page_url, origin + '/pages/protocols/dkp-5-work-cycle-001.html');
      assert.equal(p.body.message, 'Test message <b>not html</b>'); assert.equal(p.body.website, '');
      assert.ok(p.body.selection.includes(quoted.slice(0, 30))); assert.ok(p.body.elapsed_ms >= 1000);
      assert.equal(typeof p.body.section, 'string'); assert.equal(typeof p.body.section_title, 'string');
      assert.match(await page.locator('#dkp-feedback #fbs').textContent(), /e-mailed to the author/);
      assert.equal(await page.locator('#dkp-feedback #fbmsg').inputValue(), '');
    });
    reply = { code: 429, body: { error: { code: 'rate_limited' } } };
    await page.locator('#dkp-feedback #fbmsg').fill('Second');
    await page.locator('#dkp-feedback #fbsend').click();
    await check(`${width}: rate-limit message`, async () => page.locator('#dkp-feedback #fbs', { hasText: 'Too many submissions' }).waitFor({ timeout: 3000 }));
    await page.keyboard.press('Escape');
    await check(`${width}: Escape closes the dialog`, async () => assert.equal(await page.locator('#dkp-feedback #fbd').isVisible(), false));
    await check(`${width}: no page errors`, async () => assert.deepEqual(errors, []));
    await page.close();
  }
  const other = await browser.newPage();
  await other.goto(origin + '/index.html');
  await other.addScriptTag({ url: '/feedback/feedback-20261117.js' });
  await check('non-protocol page: script does nothing', async () => assert.equal(await other.locator('#dkp-feedback').count(), 0));
  await other.goto(origin + '/projects/protocol-lab/');
  await check('Lab page: no Keeper loader', async () => assert.equal(await other.locator('script[src*="keeper"]').count(), 0));
} finally { await browser.close(); server.close(); }
const ok = results.every(r => r.ok);
console.log(JSON.stringify({ ok, passed: results.filter(r => r.ok).length, total: results.length, failed: results.filter(r => !r.ok) }, null, 1));
process.exit(ok ? 0 : 1);
