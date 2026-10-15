// Site artwork in the palette of DIRECTION.md. Deterministic; rerun after a palette change.
//   node website/tools/make_art.cjs
// Writes website/assets/art/*-20261015.(webp|svg). Needs Playwright from E:/dikenocracy-work/tooling (canvas for WebP).
const fs = require('fs');
const path = require('path');
const { chromium } = require('E:/dikenocracy-work/tooling/node_modules/playwright');

const V = '20261015';
const OUT = path.join(__dirname, '..', 'assets', 'art');
const SRC = path.join(__dirname, 'source', 'welcome_screen.webp');
const INK = '#0b0c0e', ACCENT = '#1f2de6', BG = '#eef0f3', SURFACE = '#e2e5ea';
fs.mkdirSync(OUT, { recursive: true });

// The nine layers, L0 at the base, one dot per protocol (counts from build_release.py REGISTRY).
function stack() {
  const W = 560, H = 700, cx = 270, w = 200, h = 100, gap = 58, base = 600;
  const counts = [2, 6, 3, 4, 4, 6, 3, 4, 3];
  let out = '';
  for (let i = 0; i < 9; i++) {
    const y = base - i * gap, d = 8, hi = i === 0;
    out += `<polygon points="${cx - w},${y} ${cx},${y + h / 2} ${cx},${y + h / 2 + d} ${cx - w},${y + d}" fill="${hi ? ACCENT : INK}"/>` +
      `<polygon points="${cx + w},${y} ${cx},${y + h / 2} ${cx},${y + h / 2 + d} ${cx + w},${y + d}" fill="${hi ? '#1520b8' : '#2a2e35'}"/>` +
      `<polygon points="${cx},${y - h / 2} ${cx + w},${y} ${cx},${y + h / 2} ${cx - w},${y}" fill="${hi ? ACCENT : SURFACE}" stroke="${hi ? ACCENT : INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
    for (let k = 0; k < counts[i]; k++) {
      const s = (k + 1) / (counts[i] + 1) * 2 - 1;
      out += `<circle cx="${(cx + s * w * 0.55).toFixed(1)}" cy="${y}" r="5" fill="${hi ? '#ffffff' : INK}"/>`;
    }
  }
  fs.writeFileSync(path.join(OUT, `stack-${V}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Nine stacked protocol layers, L0 at the base, one dot per protocol">${out}</svg>\n`);
}
stack();

// Opinion → measurement → rule: scattered dots settle into a grid; the ordered part draws a curve.
function field() {
  const W = 600, H = 640, S = 24;
  let seed = 20261015;
  const R = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let out = '';
  for (let gy = S; gy < H; gy += S) for (let gx = S / 2; gx < W; gx += S) {
    const t = sm(0.62, 0.15, gy / H);               // top = opinion, bottom = rule
    const a = R() * Math.PI * 2, d = Math.pow(R(), 0.7) * 90 * (1 - t);
    const x = gx + Math.cos(a) * d * 0.8, y = gy + Math.sin(a) * d;
    if (x < -6 || x > W + 6 || y < -6 || y > H + 6) continue;
    if (1 - t > 0.3 && R() < 0.22 * (1 - t)) continue;
    const fx = W * 0.5 + Math.tanh((gy - H * 0.8) / 70) * W * 0.32;
    const onCurve = t > 0.98 && Math.abs(gx - fx) <= S * 0.55;
    const r = onCurve ? 5.2 : (1 - t) * (1 + R() * 4.6) + t * 3;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${onCurve ? INK : '#ffffff'}" fill-opacity="${onCurve ? 1 : (0.45 + 0.55 * t).toFixed(2)}"/>`;
  }
  fs.writeFileSync(path.join(OUT, `field-${V}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Scattered dots at the top settle into an even grid at the bottom, where a dark curve marks the rule">${out}</svg>\n`);
}
field();

// Crops of the project's own illustration. They avoid the baked-in title (left middle) and the corner watermark
// (x > 1320, y > 860). One treatment for all: a three-stop duotone from ink through cobalt to the page ground.
const CROPS = {
  [`masthead-${V}.webp`]: [0, 600, 1310, 352],   // the square, the colonnade, the street
  [`people-${V}.webp`]: [700, 600, 560, 352],    // people gathered at the pedestal
  [`dike-${V}.webp`]: [770, 200, 540, 660],      // Dike, the name's origin (About page)
  [`city-${V}.webp`]: [1060, 80, 380, 560],      // towers and the elevated rail
  [`colonnade-${V}.webp`]: [0, 600, 600, 359],   // the old colonnade and the street (left of the masthead crop)
};
(async () => {
  const b = await chromium.launch({ channel: 'msedge' });
  const p = await b.newPage();
  const src = 'data:image/webp;base64,' + fs.readFileSync(SRC).toString('base64');
  for (const [name, crop] of Object.entries(CROPS)) {
    const url = await p.evaluate(async ({ src, crop, stops }) => {
      const img = new Image(); img.src = src; await img.decode();
      const [sx, sy, sw, sh] = crop;
      const c = document.createElement('canvas'); c.width = sw; c.height = sh;
      const g = c.getContext('2d'); g.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const d = g.getImageData(0, 0, sw, sh);
      const st = stops.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
      for (let i = 0; i < d.data.length; i += 4) {
        let l = (0.2126 * d.data[i] + 0.7152 * d.data[i + 1] + 0.0722 * d.data[i + 2]) / 255;
        l = Math.min(1, Math.max(0, (l - 0.04) * 1.4));
        const [a, z, t] = l < 0.5 ? [st[0], st[1], l / 0.5] : [st[1], st[2], (l - 0.5) / 0.5];
        for (let k = 0; k < 3; k++) d.data[i + k] = a[k] + (z[k] - a[k]) * t;
      }
      g.putImageData(d, 0, 0);
      return c.toDataURL('image/webp', 0.82);
    }, { src, crop, stops: [INK, ACCENT, BG] });
    fs.writeFileSync(path.join(OUT, name), Buffer.from(url.split(',')[1], 'base64'));
  }
  await b.close();
  for (const f of fs.readdirSync(OUT)) console.log(f, fs.statSync(path.join(OUT, f)).size);
})();
