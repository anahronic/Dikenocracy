# Dikenocracy Website — Structure Audit

**Date:** 2026-03-18  
**Domain:** dikenocracy.com (37.27.244.96)  
**Repository:** https://github.com/anahronic/Dikenocracy  
**Branch:** main

---

## 1. File Tree

```
website/
├── index.html                          ← Landing (intro → welcome → enter)
├── styles.css                          ← Global stylesheet (603 lines)
├── script.js                           ← Global JS (103 lines, no deps)
├── build_protocols.py                  ← One-time MD→HTML generator
│
├── assets/
│   ├── main_screen.png                 ← Intro background   (5.6 MB, 2528×1684 RGBA)
│   ├── welcome_screen.png              ← Welcome background  (7.6 MB, 2528×1684 RGBA)
│   ├── enter.png                       ← Enter button image  (6.0 MB, 2528×1684 RGBA)
│   ├── Dikenocracy SYNERGY and 31 PROTOCOLS .md   ← Source markdown (247 KB, 9021 lines)
│   └── README.txt
│
├── Images/                             ← Original uploads (NOT referenced in HTML)
│   ├── Main screen.png
│   ├── Welcome screen.png
│   ├── Enter.png
│   ├── ChatGPT Image 17 мар. 2026 г., 20_20_15.png
│   ├── Выгода.png
│   ├── Добро пожаловать.png
│   ├── Кнопка далее.png
│   ├── гника.png
│   ├── дикенократия.png
│   ├── кнопка предидущий.png
│   ├── люди ходят по кругу внутри стен.png
│   ├── проекты.png
│   └── флаг.png
│
├── pages/
│   ├── about.html                      ← About Dikenocracy
│   ├── protocols.html                  ← Protocol index (all 31 linked)
│   ├── projects.html                   ← Active & planned projects
│   ├── converter.html                  ← DTI Time Converter page
│   │
│   └── protocols/                      ← 34 generated protocol pages
│       ├── manifest.txt
│       ├── dikenocracy.html            ← Title page (2 lines content)
│       ├── code-of-planetary-synergy.html
│       ├── appendix-a-design-rationale-safeguards-normative.html
│       │
│       │   ── L0: Physical Truth ──
│       ├── dkp-0-oracle-001.html
│       ├── dkp-0-time-001.html
│       │
│       │   ── L1: Core ──
│       ├── dkp-1-axioms-001.html
│       ├── dkp-1-identity-001.html
│       ├── dkp-1-impact-001.html
│       ├── dkp-1-justice-001.html
│       │
│       │   ── L2: Economic ──
│       ├── dkp-2-assets-001.html
│       ├── dkp-2-finance-001.html
│       ├── dkp-2-labor-001.html
│       │
│       │   ── L3: Security ──
│       ├── dkp-3-antiterror-001.html
│       ├── dkp-3-defense-001.html
│       ├── dkp-3-internal-sec-001.html
│       ├── dkp-3-police-001.html
│       │
│       │   ── L4: Stability ──
│       ├── dkp-4-crisis-001.html
│       ├── dkp-4-error-001.html
│       ├── dkp-4-upgrade-001.html
│       │
│       │   ── L5: Human Infrastructure ──
│       ├── dkp-5-culture-001.html
│       ├── dkp-5-edu-001.html
│       ├── dkp-5-habitat-001.html
│       ├── dkp-5-info-001.html
│       ├── dkp-5-transport-001.html
│       ├── dkp-5-work-cycle-001.html
│       │
│       │   ── L6: Intersystem ──
│       ├── dkp-6-exit-001.html
│       ├── dkp-6-integration-001.html
│       │
│       │   ── L7: Meta / Scope ──
│       ├── dkp-7-ai-subject-001.html
│       ├── dkp-7-privacy-001.html
│       ├── dkp-7-scope-001.html
│       ├── dkp-7-transparency-001.html
│       │
│       │   ── L8: Infrastructure ──
│       ├── dkp-8-audit-001.html
│       ├── dkp-8-interop-001.html
│       └── dkp-8-simulation-001.html
```

---

## 2. Page Map

| Page | Path | Lines | Nav Position | aria-current |
|------|------|------:|--------------|--------------|
| **Landing** | `index.html` | 64 | none (splash) | — |
| **About** | `pages/about.html` | 148 | About | page |
| **Protocols** | `pages/protocols.html` | 353 | Protocols | page |
| **Projects** | `pages/projects.html` | 134 | Projects | page |
| **Converter** | `pages/converter.html` | 179 | Converter | page |
| **Protocol sub-pages** | `pages/protocols/*.html` | 34 files, 7640 total | Protocols | page |

### Navigation flow

```
index.html  ──[5s intro]──▸  welcome screen  ──[Enter]──▸  pages/about.html
                                                                │
           ┌─────────────────────────────────┬──────────────────┤
           ▼                                 ▼                  ▼
      protocols.html                   projects.html      converter.html
           │
           ├── protocols/dkp-0-oracle-001.html
           ├── protocols/dkp-0-time-001.html
           ├── ... (34 sub-pages)
           └── protocols/dkp-8-simulation-001.html
                    │
                    └── [← All Protocols] back to protocols.html
```

---

## 3. Size Report

| Category | Files | Size |
|----------|------:|-----:|
| HTML (main pages) | 5 | ~18 KB |
| HTML (protocol pages) | 34 | ~358 KB |
| CSS | 1 | ~14 KB |
| JS | 1 | ~4 KB |
| Images (assets/, deployed) | 3 PNG | **19.2 MB** |
| Images (Images/, NOT deployed) | 13 PNG | **60 MB** |
| Source markdown | 1 | 247 KB |
| **Total deployed** | — | **~20 MB** |
| **Total in repo** | — | **~80 MB** |

---

## 4. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Markup | Static HTML5 | Semantic, accessible, no framework |
| Styles | Single CSS file | CSS custom properties, mobile-first |
| JS | Vanilla ES5 IIFE | Intro sequence + hamburger nav |
| Fonts | System stack | Georgia / Segoe UI / Courier New |
| Build | Python 3 script | One-shot MD→HTML, no runtime deps |
| Hosting | Static files via Nginx | dikenocracy.com |
| VCS | Git → GitHub | anahronic/Dikenocracy, main branch |

---

## 5. CSS Architecture

### Custom Properties (20 vars)

| Variable | Value | Usage |
|----------|-------|-------|
| `--bg-deep` | `#0a0a0c` | Body background |
| `--bg-panel` | `#111117` | Cards, panels, code blocks |
| `--bg-card` | `#16161e` | Card backgrounds |
| `--border` | `#2a2a38` | All borders and dividers |
| `--accent` | `#b06bff` | Links, labels, highlights |
| `--accent-alt` | `#f0a940` | Info notes |
| `--accent-dim` | `rgba(176,107,255,0.25)` | Borders, hover states |
| `--text-primary` | `#e8e8ec` | Headings, body text |
| `--text-secondary` | `#9898a8` | Descriptions, meta |
| `--text-muted` | `#5a5a6a` | Footer, placeholders |

### Component Classes (17 blocks)

```
.screen, .screen--hidden     ← Intro/welcome screens
.enter-btn                   ← Enter button
.site-nav, __inner, __brand, __toggle, __links  ← Navigation
.page-wrapper                ← Content container
.hero, __title, __sub        ← Page headers
.section, __heading, __text  ← Content sections
.cards, .card, __label, __title, __text  ← Card grid
.entry-points, .btn, --secondary         ← Action buttons
.protocol-layer, __id, __name, __desc    ← Protocol index items
.protocol-article            ← Generated protocol content
.protocol-table              ← Protocol tables
.converter-frame-wrap        ← Converter iframe
.converter-launch, __text    ← Converter launch area
.info-note                   ← Warning/info boxes
.site-footer                 ← Footer
.divider                     ← Horizontal rule
.sr-only                     ← Screen reader utility
```

### Responsive Breakpoints

| Breakpoint | Target |
|-----------|--------|
| `max-width: 680px` | Mobile: hamburger nav, stacked layout |

---

## 6. JavaScript Functions

| Function | Scope | Description |
|----------|-------|-------------|
| `initIntroSequence()` | index.html only | 5s intro → fade → welcome → Enter button |
| `initMobileNav()` | All pages with `.site-nav` | Hamburger toggle, Escape close, link close |

No external dependencies. No fetch/XHR. No analytics. No cookies.

---

## 7. Link Integrity

### Internal links: **ALL VALID**

- 5 main pages: all cross-linked correctly
- 34 protocol sub-pages: all have correct `../../` relative paths
- protocols.html → 33 protocol sub-page links (all files exist)
- Every protocol sub-page → `← All Protocols` backlink present

### One unlinked page

| File | Status |
|------|--------|
| `protocols/dikenocracy.html` | EXISTS but NOT linked from protocols.html |

This is the title-only page (2 lines of content: just "Dikenocracy"). Can be safely removed or left as-is.

### External links

| URL | Page | Status |
|-----|------|--------|
| `https://github.com/anahronic/Dikenocracy` | protocols.html, converter.html | OK |
| `https://github.com/anahronic/Dikenocracy/tree/main/Converter%20DTI` | converter.html | OK |
| `http://localhost:8501` | converter.html | **⚠ localhost — won't work for visitors** |

---

## 8. Issues Found

### Critical

| # | Issue | Fix |
|---|-------|-----|
| C1 | **Images too large**: 3 PNG at 5.6–7.6 MB each (2528×1684 RGBA). Total 19.2 MB just for splash screens. First load will be ~20 MB. | Compress to WebP (lossy 85%) or resize to 1440px wide → expected ~200-400 KB each |
| C2 | **Converter link points to localhost:8501** — broken for all public visitors | Change to `https://dikenocracy.com/converter/` or actual deployed endpoint |

### High

| # | Issue | Fix |
|---|-------|-----|
| H1 | **No favicon** — browser shows default icon, looks unfinished | Add `<link rel="icon" href="...">` to all pages |
| H2 | **No Open Graph / Twitter Card meta** — social sharing shows blank preview | Add `og:title`, `og:description`, `og:image`, `twitter:card` tags |
| H3 | **No robots.txt** — search engines have no crawl guidance | Create `robots.txt` with `Sitemap:` directive |
| H4 | **No sitemap.xml** — search engines won't index protocol subpages efficiently | Generate `sitemap.xml` with all 39 URLs |
| H5 | **Images/ directory** (60 MB) — original Russian-named uploads still in repo, not referenced by any page | Either `.gitignore` or `git rm` the entire `Images/` directory |

### Medium

| # | Issue | Fix |
|---|-------|-----|
| M1 | **Only one responsive breakpoint** (680px) — no tablet breakpoint | Add `@media (max-width: 1024px)` for tablet card grid |
| M2 | **No `<link rel="canonical">` on index.html or about.html** — duplicate content risk | Add canonical URLs to all pages |
| M3 | **No 404 page** — server will show Nginx default for wrong URLs | Create `404.html` matching site design |
| M4 | **No `lang` attribute consistency** — all pages say `lang="en"` but protocol content is English, OK for now | Consider if multilingual support needed |
| M5 | **`build_protocols.py` uses hardcoded absolute paths** | Use `pathlib.Path(__file__).parent` for portability |
| M6 | **No `.gitignore` in website/** | Add to exclude `__pycache__/`, `*.pyc`, `Images/` |

### Low

| # | Issue | Fix |
|---|-------|-----|
| L1 | **`dikenocracy.html`** protocol page exists but not linked (2-line stub) | Remove from generated output or link from protocols.html |
| L2 | **No print stylesheet** | Add `@media print` rules for protocol pages (likely to be printed) |
| L3 | **Protocol page heading level**: generated pages start at `<h2>` after nav (no `<h1>` in article) | Add protocol title as `<h1>` in the template |
| L4 | **No `loading="lazy"` on Enter button image** | Add for performance |
| L5 | **Inline `<style>` in index.html** (`overflow:hidden`) | Move to styles.css under page-specific scope |

---

## 9. Protocol Coverage

### Source document: 29 unique DKP identifiers + Synergy Code + Appendix A

| Layer | Protocol ID | HTML Page | Status |
|-------|------------|-----------|--------|
| — | Code of Planetary Synergy | `code-of-planetary-synergy.html` | ✅ |
| L0 | DKP-0-ORACLE-001 | `dkp-0-oracle-001.html` | ✅ |
| L0 | DKP-0-TIME-001 | `dkp-0-time-001.html` | ✅ |
| L1 | DKP-1-AXIOMS-001 | `dkp-1-axioms-001.html` | ✅ |
| L1 | DKP-1-IDENTITY-001 | `dkp-1-identity-001.html` | ✅ |
| L1 | DKP-1-IMPACT-001 | `dkp-1-impact-001.html` | ✅ |
| L1 | DKP-1-JUSTICE-001 | `dkp-1-justice-001.html` | ✅ |
| L2 | DKP-2-ASSETS-001 | `dkp-2-assets-001.html` | ✅ |
| L2 | DKP-2-FINANCE-001 | `dkp-2-finance-001.html` | ✅ |
| L2 | DKP-2-LABOR-001 | `dkp-2-labor-001.html` | ✅ |
| L3 | DKP-3-ANTITERROR-001 | `dkp-3-antiterror-001.html` | ✅ |
| L3 | DKP-3-DEFENSE-001 | `dkp-3-defense-001.html` | ✅ |
| L3 | DKP-3-INTERNAL-SEC-001 | `dkp-3-internal-sec-001.html` | ✅ |
| L3 | DKP-3-POLICE-001 | `dkp-3-police-001.html` | ✅ |
| L4 | DKP-4-CRISIS-001 | `dkp-4-crisis-001.html` | ✅ |
| L4 | DKP-4-ERROR-001 | `dkp-4-error-001.html` | ✅ |
| L4 | DKP-4-UPGRADE-001 | `dkp-4-upgrade-001.html` | ✅ |
| L5 | DKP-5-CULTURE-001 | `dkp-5-culture-001.html` | ✅ |
| L5 | DKP-5-EDU-001 | `dkp-5-edu-001.html` | ✅ |
| L5 | DKP-5-HABITAT-001 | `dkp-5-habitat-001.html` | ✅ |
| L5 | DKP-5-INFO-001 | `dkp-5-info-001.html` | ✅ |
| L5 | DKP-5-TRANSPORT-001 | `dkp-5-transport-001.html` | ✅ |
| L5 | DKP-5-WORK-CYCLE-001 | `dkp-5-work-cycle-001.html` | ✅ |
| L6 | DKP-6-EXIT-001 | `dkp-6-exit-001.html` | ✅ |
| L6 | DKP-6-INTEGRATION-001 | `dkp-6-integration-001.html` | ✅ |
| L7 | DKP-7-AI-SUBJECT-001 | `dkp-7-ai-subject-001.html` | ✅ |
| L7 | DKP-7-PRIVACY-001 | `dkp-7-privacy-001.html` | ✅ |
| L7 | DKP-7-SCOPE-001 | `dkp-7-scope-001.html` | ✅ |
| L7 | DKP-7-TRANSPARENCY-001 | `dkp-7-transparency-001.html` | ✅ |
| L8 | DKP-8-AUDIT-001 | `dkp-8-audit-001.html` | ✅ |
| L8 | DKP-8-INTEROP-001 | `dkp-8-interop-001.html` | ✅ |
| L8 | DKP-8-SIMULATION-001 | `dkp-8-simulation-001.html` | ✅ |
| — | Appendix A | `appendix-a-design-rationale-safeguards-normative.html` | ✅ |

### Referenced but no dedicated section in source

| ID | Notes |
|----|-------|
| DKP-2-ECONOMIC-001 | Mentioned once as a cross-reference at line 6175 — no standalone protocol text exists |

**Total: 31 DKP protocols + Code of Synergy + Appendix A = 33 content pages (+ 1 stub title page)**

---

## 10. Accessibility Summary

| Check | Status |
|-------|--------|
| `lang="en"` | ✅ All pages |
| `<meta viewport>` | ✅ All pages |
| Semantic HTML (`nav`, `main`, `footer`, `article`, `section`) | ✅ |
| `aria-label` on nav and screens | ✅ |
| `aria-current="page"` on active nav item | ✅ |
| `aria-expanded` on hamburger toggle | ✅ |
| `aria-controls` linking toggle to menu | ✅ |
| Keyboard navigation (Enter/Space on button, Escape to close) | ✅ |
| `alt` text on Enter button image | ✅ |
| Color contrast (light text on dark bg) | ✅ estimated AA+ |
| Focus styles (outline on `.enter-btn`, `.btn`) | ✅ |
| Skip-to-content link | ❌ Missing |
| `<h1>` present on every page | ⚠ Missing on protocol sub-pages |

---

## 11. Deployment Checklist

```
[ ] Compress images (WebP, ≤400 KB each)
[ ] Add favicon.ico + apple-touch-icon
[ ] Add Open Graph meta tags
[ ] Create robots.txt
[ ] Generate sitemap.xml
[ ] Create 404.html
[ ] Fix converter link (localhost → actual endpoint)
[ ] Remove or .gitignore Images/ directory
[ ] Add <h1> to protocol sub-page template
[ ] Add skip-to-content link to nav
[ ] Test on mobile (320px, 375px, 414px)
[ ] Test on tablet (768px, 1024px)
[ ] Validate HTML (W3C validator)
[ ] Set Cache-Control headers for static assets (Nginx)
[ ] Enable gzip/brotli compression (Nginx)
[ ] Configure HTTPS redirect (HTTP → HTTPS)
```
