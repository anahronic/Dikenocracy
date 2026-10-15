// Generates the artwork for the design concepts (deterministic: same seed, same pictures).
//   node website/tools/concepts/make_art.cjs
// Output goes to website/tools/concepts/art/. Needs Playwright from E:/dikenocracy-work/tooling.
const fs = require('fs');
const path = require('path');
const { chromium } = require('E:/dikenocracy-work/tooling/node_modules/playwright');

const HERE = __dirname;
const OUT = path.join(HERE, 'art');
const SRC = path.join(HERE, '..', 'source', 'welcome_screen.webp');
fs.mkdirSync(OUT, { recursive: true });

function rng(seed) { // mulberry32
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const f1 = n => Math.round(n * 10) / 10;

// ─── 1. Opinion → measurement → rule: a dot field that settles into a grid ───
function field({ ink, noise, signal, file }) {
  const W = 1200, H = 560, S = 20, R = rng(20261014);
  const dots = [];
  for (let gy = S; gy < H; gy += S) {
    for (let gx = S / 2; gx < W; gx += S) {
      const u = gx / W;
      const t = smooth(0.18, 0.62, u);               // 0 = opinion, 1 = rule
      const a = R() * Math.PI * 2, d = Math.pow(R(), 0.7) * 120 * (1 - t);
      const x = gx + Math.cos(a) * d, y = gy + Math.sin(a) * d * 0.8;
      const r = (1 - t) * (0.8 + R() * 4.6) + t * 2.6;
      // the "function": a smooth curve drawn by the ordered dots
      const fy = H * 0.62 - Math.tanh((gx - W * 0.8) / 150) * H * 0.3;
      const onCurve = t > 0.98 && Math.abs(gy - fy) <= S * 0.55;
      if (x < -6 || x > W + 6 || y < -6 || y > H + 6) continue;
      if ((1 - t) > 0.3 && R() < 0.22 * (1 - t)) continue; // sparser chaos
      dots.push(onCurve
        ? `<circle cx="${f1(x)}" cy="${f1(y)}" r="4.4" fill="${signal}"/>`
        : `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${t > 0.5 ? ink : noise}" fill-opacity="${f1(0.45 + 0.55 * t)}"/>`);
    }
  }
  const mx = W * 0.62;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">` +
    `<line x1="${mx}" y1="0" x2="${mx}" y2="${H}" stroke="${signal}" stroke-width="1.5" stroke-dasharray="3 6"/>` +
    dots.join('') + '</svg>';
  fs.writeFileSync(path.join(OUT, file), svg);
  return dots.length;
}

// ─── 2. Isometric protocol stack, line art ───
function stack({ line, fill, hi, hiText, file }) {
  const W = 640, H = 600, cx = 300, w = 200, h = 100, gap = 54, base = 532;
  const names = ['Physical Truth', 'Core', 'Economic', 'Security', 'Stability', 'Human Infra', 'Intersystem', 'Meta / Scope', 'Infrastructure'];
  const counts = [2, 6, 3, 4, 4, 6, 3, 4, 3];
  let out = '';
  for (let i = 0; i < 9; i++) {
    const y = base - i * gap;
    const top = `${cx},${y - h / 2} ${cx + w},${y} ${cx},${y + h / 2} ${cx - w},${y}`;
    const isHi = i === 0;
    const d = 7; // plate thickness
    out += `<g>` +
      `<polygon points="${cx - w},${y} ${cx},${y + h / 2} ${cx},${y + h / 2 + d} ${cx - w},${y + d}" fill="${isHi ? hi : line}" fill-opacity="${isHi ? 1 : 0.35}"/>` +
      `<polygon points="${cx + w},${y} ${cx},${y + h / 2} ${cx},${y + h / 2 + d} ${cx + w},${y + d}" fill="${isHi ? hi : line}" fill-opacity="${isHi ? 0.75 : 0.2}"/>` +
      `<polygon points="${top}" fill="${isHi ? hi : fill}" stroke="${isHi ? hi : line}" stroke-width="1.4" stroke-linejoin="round"/>`;
    // dots on the plate: one per protocol, along its long axis
    for (let k = 0; k < counts[i]; k++) {
      const s = (k + 1) / (counts[i] + 1) * 2 - 1; // -1..1
      out += `<circle cx="${f1(cx + s * w * 0.55)}" cy="${y}" r="4" fill="${isHi ? hiText : line}"/>`;
    }
    out += `<line x1="${cx + w + 14}" y1="${y}" x2="${cx + w + 46}" y2="${y}" stroke="${isHi ? hi : line}" stroke-opacity="${isHi ? 1 : 0.6}" stroke-width="1.4"/>` +
      `<text x="${cx + w + 54}" y="${y + 5}" font-family="JetBrains Mono, Consolas, monospace" font-size="15" fill="${isHi ? hi : line}">L${i}</text>` +
      `</g>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${out}</svg>`;
  fs.writeFileSync(path.join(OUT, file), svg);
}

field({ ink: '#141412', noise: '#8d897e', signal: '#ff4d1f', file: 'field-paper.svg' });
field({ ink: '#ffffff', noise: '#9aa6ff', signal: '#d4f542', file: 'field-cobalt.svg' });
stack({ line: '#ffffff', fill: '#2433d6', hi: '#d4f542', hiText: '#0b0f2b', file: 'stack-cobalt.svg' });

// ─── 3. Halftone and duotone versions of the welcome illustration (canvas in a browser) ───
(async () => {
  const b = await chromium.launch({ channel: 'msedge' });
  const p = await b.newPage();
  const src = 'data:image/webp;base64,' + fs.readFileSync(SRC).toString('base64');
  const jobs = {
    // crops avoid the baked-in title (left middle) and the corner watermark (x > 1320, y > 860)
    'mono-square.webp': { mode: 'duotone', crop: [0, 600, 1310, 352], stops: ['#141412', '#77736a', '#f3f1ea'], scale: 1, q: 0.8 },
    'duotone-cobalt.webp': { mode: 'duotone', crop: [0, 600, 1310, 352], stops: ['#0b0f2b', '#2433d6', '#e8f6a6'], scale: 1, q: 0.8 },
    'duotone-statue.webp': { mode: 'duotone', crop: [770, 200, 540, 660], stops: ['#0b0f2b', '#2433d6', '#e8f6a6'], scale: 1, q: 0.8 },
  };
  for (const [name, job] of Object.entries(jobs)) {
    const dataUrl = await p.evaluate(async ({ src, job }) => {
      const img = new Image(); img.src = src; await img.decode();
      const [sx, sy, sw, sh] = job.crop;
      const c = document.createElement('canvas'); const g = c.getContext('2d');
      const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
      if (job.mode === 'duotone') {
        c.width = sw * job.scale; c.height = sh * job.scale;
        g.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
        const d = g.getImageData(0, 0, c.width, c.height); const st = job.stops.map(hex);
        for (let i = 0; i < d.data.length; i += 4) {
          let l = (0.2126 * d.data[i] + 0.7152 * d.data[i + 1] + 0.0722 * d.data[i + 2]) / 255;
          l = Math.min(1, Math.max(0, (l - 0.04) * 1.35));
          const [a, bb, t] = l < 0.5 ? [st[0], st[1], l / 0.5] : [st[1], st[2], (l - 0.5) / 0.5];
          for (let k = 0; k < 3; k++) d.data[i + k] = a[k] + (bb[k] - a[k]) * t;
        }
        g.putImageData(d, 0, 0);
        return c.toDataURL('image/webp', job.q);
      }
      // halftone: sample the brightness on a grid, one dot per cell
      const s = document.createElement('canvas'); s.width = sw; s.height = sh;
      const sg = s.getContext('2d'); sg.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const px = sg.getImageData(0, 0, sw, sh).data;
      c.width = sw * job.scale; c.height = sh * job.scale;
      g.fillStyle = job.bg; g.fillRect(0, 0, c.width, c.height); g.fillStyle = job.dot;
      const st = job.step;
      for (let y = st / 2, row = 0; y < sh; y += st * 0.866, row++) {
        for (let x = (row % 2 ? st : st / 2); x < sw; x += st) {
          const i = (Math.floor(y) * sw + Math.floor(x)) * 4;
          let l = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
          l = Math.pow(Math.min(1, Math.max(0, (l - 0.05) * 1.6)), 0.9);
          const v = job.mode === 'halftone' ? l : 1 - l * 0.9;
          const r = v * st * 0.58 * job.scale;
          if (r < 0.5) continue;
          g.beginPath(); g.arc(x * job.scale, y * job.scale, r, 0, Math.PI * 2); g.fill();
        }
      }
      return c.toDataURL('image/webp', job.q);
    }, { src, job });
    fs.writeFileSync(path.join(OUT, name), Buffer.from(dataUrl.split(',')[1], 'base64'));
  }
  await b.close();
  for (const f of fs.readdirSync(OUT)) console.log(f, fs.statSync(path.join(OUT, f)).size);
})();
