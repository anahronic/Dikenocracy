#!/usr/bin/env python3
"""
Build one consistent Dikenocracy release from the canonical Markdown sources.

Canonical sources (normative text): github.com/anahronic/World, folder Dikenocracy/
  CODE-OF-PLANETARY-SYNERGY.md, Protocols/<Layer>/<ID>.md, Dikenocracy Glossary.md
Each source starts with a YAML-like front matter block:
  id, slug, kind (code | protocol | addendum | appendix), last_updated (YYYY-MM-DD), meta (optional)

Outputs (all from the same sources in one run):
  website/pages/protocols/<slug>.html     protocol pages (existing site template)
  website/pages/protocols.html            index, counter computed from the sources
  website/pages/protocols/manifest.txt    slug -> title list
  website/sitemap.xml                     protocol URLs refreshed, other URLs kept
  website/downloads/<consolidated>.txt    "Dikenocracy SYNERGY and N PROTOCOLS.txt"
  <World>/Dikenocracy/**/<ID>.docx        DOCX rendering of each source (--docx)
  <World>/SHA256SUMS.txt                  digests of the canonical sources and the TXT

Dates: each page shows its own source's last_updated. The index and the TXT show the
release date (--release-date). Rebuilding does not change any document date.

Usage:
  python build_release.py --world ../../World --release-date 2026-10-04 [--docx] [--txt-copy PATH ...]
Requires: pandoc (pypandoc-binary), beautifulsoup4.
"""
import argparse, hashlib, html, pathlib, re, shutil, sys
from datetime import date

import pypandoc
from bs4 import BeautifulSoup

SITE = pathlib.Path(__file__).resolve().parent
TOOLS = SITE / 'tools'
DOMAIN = 'https://dikenocracy.com'
CSS_MAIN = '/styles-20260923.css'
CSS_PROTOCOLS = '/protocols-20261004.css'

# Order of the publication. (slug, layer, map label, index subtitle)
LAYERS = [
    ('foundation', 'Foundation', 'Foundation'),
    ('L0', 'L0 — Physical Truth', 'L0 — Physical Truth'),
    ('L1', 'L1 — Core', 'L1 — Core'),
    ('L2', 'L2 — Economic', 'L2 — Economic'),
    ('L3', 'L3 — Security', 'L3 — Security'),
    ('L4', 'L4 — Stability', 'L4 — Stability'),
    ('L5', 'L5 — Human Infra', 'L5 — Human Infrastructure'),
    ('L6', 'L6 — Intersystem', 'L6 — Intersystem'),
    ('L7', 'L7 — Meta / Scope', 'L7 — Meta / Scope'),
    ('L8', 'L8 — Infrastructure', 'L8 — Infrastructure'),
    ('appendix', 'Appendix', 'Appendix'),
]
LAYER_TEXT = {
    'L0': 'The foundation layer. Defines how observable physical reality is captured,\n          verified, and made available to higher layers.',
    'L1': 'Foundational axioms, identity attribution, impact measurement, and justice\n          invariants that all higher layers must respect.',
    'L2': 'Dual-circuit economy rules, tokenized value chains, conditional emission,\n          and stake-based security mechanisms.',
    'L3': 'Defense, counter-terrorism, internal security, and physical enforcement\n          within strict constraint boundaries.',
    'L4': 'Crisis handling, error correction, and controlled protocol upgrade mechanisms.',
    'L5': 'Culture, education, habitat, information, transport, and work-cycle standards\n          for physical and cognitive dignity.',
    'L6': 'Entry and exit protocols for jurisdictions interfacing with the Dikenocracy system.',
    'L7': 'Applicability boundaries, privacy hard limits, transparency requirements,\n          and AI subject constraints.',
    'L8': 'Continuous audit, external interoperability, and simulation &amp; validation\n          engines.',
}
REGISTRY = [
    ('code-of-planetary-synergy', 'foundation', 'Synergy Code', 'Foundational normative document of the Dikenocracy system'),
    ('dkp-0-oracle-001', 'L0', 'ORACLE', 'Physical Truth Layer Protocol (PTL)'),
    ('dkp-0-time-001', 'L0', 'TIME', 'Dikenocratic Time & Date Index Protocol (DTI)'),
    ('dkp-1-axioms-001', 'L1', 'AXIOMS', 'Axioms Protocol'),
    ('dkp-1-epistemic-boundaries-001', 'L1', 'EPISTEMIC-BOUNDARIES', 'Epistemic Boundaries Protocol'),
    ('dkp-1-identity-001', 'L1', 'IDENTITY', 'Identity & Subject Protocol'),
    ('dkp-1-impact-001', 'L1', 'IMPACT', 'Impact Measurement Protocol'),
    ('dkp-1-justice-001', 'L1', 'JUSTICE', 'Justice Function Protocol (δίκη)'),
    ('dkp-1-prevention-001', 'L1', 'PREVENTION', 'Preventive Impact Attribution Protocol'),
    ('dkp-2-assets-001', 'L2', 'ASSETS', 'Property & Assets Protocol'),
    ('dkp-2-finance-001', 'L2', 'FINANCE', 'Financial System Protocol'),
    ('dkp-2-labor-001', 'L2', 'LABOR', 'Labor & Participation Protocol'),
    ('dkp-3-antiterror-001', 'L3', 'ANTITERROR', 'Anti-Terror & Asymmetric Harm Containment Protocol'),
    ('dkp-3-defense-001', 'L3', 'DEFENSE', 'Defense & System Protection Protocol'),
    ('dkp-3-internal-sec-001', 'L3', 'INTERNAL-SEC', 'Internal Security & System Integrity Protocol'),
    ('dkp-3-police-001', 'L3', 'POLICE', 'Public Order & Physical Enforcement Protocol'),
    ('dkp-4-crisis-001', 'L4', 'CRISIS', 'Crisis & Fail-Safe Protocol'),
    ('dkp-4-crisis-001-patch', 'L4', 'CRISIS PATCH', 'Addendum to DKP-4-CRISIS-001: Null-Output State Handling Extension'),
    ('dkp-4-error-001', 'L4', 'ERROR', 'Errors & Appeals Protocol'),
    ('dkp-4-upgrade-001', 'L4', 'UPGRADE', 'System Upgrade & Anti-Capture Protocol'),
    ('dkp-4-epistemic-transitions-001', 'L4', 'EPISTEMIC-TRANSITIONS', 'Epistemic State Transition Protocol'),
    ('dkp-5-culture-001', 'L5', 'CULTURE', 'Culture & Language Protocol'),
    ('dkp-5-edu-001', 'L5', 'EDU', 'Education Protocol'),
    ('dkp-5-habitat-001', 'L5', 'HABITAT', 'Living Space & Environmental Dignity Protocol'),
    ('dkp-5-info-001', 'L5', 'INFO', 'Information & Truth Protocol'),
    ('dkp-5-transport-001', 'L5', 'TRANSPORT', 'Public Transport, Risk Reduction & Physical Dignity Protocol'),
    ('dkp-5-work-cycle-001', 'L5', 'WORK-CYCLE', 'Work Cycle & Recovery Rhythm Protocol'),
    ('dkp-6-exit-001', 'L6', 'EXIT', 'Exit Protocol'),
    ('dkp-6-integration-001', 'L6', 'INTEGRATION', 'Integration Protocol'),
    ('dkp-6-resilience-001', 'L6', 'RESILIENCE', 'System Resilience Under Adversarial Conditions'),
    ('dkp-7-ai-subject-001', 'L7', 'AI-SUBJECT', 'Constitution for AI Subjects in Dikenocracy'),
    ('dkp-7-privacy-001', 'L7', 'PRIVACY', 'Data Privacy Protocol'),
    ('dkp-7-scope-001', 'L7', 'SCOPE', 'Scope & Limits Protocol'),
    ('dkp-7-transparency-001', 'L7', 'TRANSPARENCY', 'Transparency Protocol'),
    ('dkp-8-audit-001', 'L8', 'AUDIT', 'Continuous Audit Protocol'),
    ('dkp-8-interop-001', 'L8', 'INTEROP', 'Interoperability Protocol'),
    ('dkp-8-simulation-001', 'L8', 'SIMULATION', 'Simulation & Validation Protocol'),
    ('appendix-a-design-rationale-safeguards-normative', 'appendix', 'Appendix A', 'Design Rationale & Safeguards (Normative) — appendix to DKP-5-TRANSPORT-001'),
]

DATE_LABEL = {'en': 'Last updated', 'ru': 'Последнее обновление'}


def format_date(d, lang='en'):
    """'Last updated: YYYY-MM-DD' (en) or 'Последнее обновление: ДД.ММ.ГГГГ' (ru)."""
    y, m, dd = d.split('-')
    return f'{DATE_LABEL[lang]}: ' + (d if lang == 'en' else f'{dd}.{m}.{y}')


# ── Sources ────────────────────────────────────────────────────────────────────

def read_source(path):
    text = path.read_text(encoding='utf-8')
    m = re.match(r'---\n(.*?)\n---\n', text, re.S)
    if not m:
        return None
    meta = {}
    for line in m.group(1).splitlines():
        k, _, v = line.partition(':')
        meta[k.strip()] = v.strip().strip('"')
    date.fromisoformat(meta['last_updated'])
    meta['body'] = text[m.end():].lstrip('\n')
    meta['path'] = path
    return meta


def load_sources(world):
    docs = {}
    for p in sorted((world / 'Dikenocracy').rglob('*.md')):
        d = read_source(p)
        if d:
            if d['slug'] in docs:
                sys.exit(f'duplicate slug {d["slug"]}: {p}')
            docs[d['slug']] = d
    missing = [s for s, *_ in REGISTRY if s not in docs]
    extra = [s for s in docs if s not in {r[0] for r in REGISTRY}]
    if missing or extra:
        sys.exit(f'registry mismatch: missing={missing} unregistered={extra}')
    return docs


def protocol_ids(docs):
    ids = [docs[s]['id'] for s, *_ in REGISTRY if docs[s]['kind'] == 'protocol']
    if len(ids) != len(set(ids)):
        sys.exit(f'duplicate protocol IDs: {ids}')
    return ids


# ── HTML ───────────────────────────────────────────────────────────────────────

# Anchors that were set by hand on the published pages; kept so that existing links still work.
ID_OVERRIDES = {
    ('dkp-3-defense-001', 'Epistemic Classification of Trajectory-Based Authorization'): 'epistemic-classification-vpi',
    ('dkp-6-resilience-001', '5.7 Interface Integrity (NEW — fixes Bundle Distortion)'): '57-interface-integrity',
    ('dkp-6-resilience-001', '5.8 Anti-Sybil Consistency (NEW)'): '58-anti-sybil-consistency',
    ('dkp-6-resilience-001', '8.4 Statistical Collapse (NEW)'): '84-statistical-collapse',
    ('dkp-6-resilience-001', '8.5 Interface Degradation (NEW)'): '85-interface-degradation',
    ('dkp-6-resilience-001', 'Что изменено (для аудита)'): 'audit-changelog',
    ('dkp-1-prevention-001', '3.2 Risk Channel Rcᵢ'): '32-risk-channel-rci',
    ('dkp-1-prevention-001', '3.3 Threat Activation Signal (TAₖ)'): '33-threat-activation-signal-tak',
    ('dkp-1-prevention-001', '3.3.1 Consistent regime'): '331-consistent-regime',
    ('dkp-1-prevention-001', '3.3.2 Inconsistent regime'): '332-inconsistent-regime',
    ('dkp-1-prevention-001', '3.4 Subject-linked Intervention (SIₖ)'): '34-subject-linked-intervention-sik',
    ('dkp-1-prevention-001', '3.5 Suppression Event (SEₖ)'): '35-suppression-event-sek',
    ('dkp-1-prevention-001', '3.6 Suppression Completeness (Sₖ)'): '36-suppression-completeness-sk',
    ('dkp-1-prevention-001', '3.7 Threat Severity Weight (Wₖ)'): '37-threat-severity-weight-wk',
    ('dkp-1-prevention-001', '3.8 Attribution Factor (Aₖ)'): '38-attribution-factor-ak',
    ('dkp-1-prevention-001', '3.9 Confidence Factor (Cₖ)'): '39-confidence-factor-ck',
    ('dkp-1-prevention-001', '3.10 Tamper Resistance Factor (Tₖ)'): '310-tamper-resistance-factor-tk',
    ('dkp-1-prevention-001', '3.11 Contextual Baseline Field (CBFᵢ)'): '311-contextual-baseline-field-cbfi',
}


def heading_id(text, counts):
    s = re.sub(r'[^a-z0-9\s-]', '', text.lower())
    s = re.sub(r'\s+', '-', s.strip())
    s = s[:60].rstrip('-') or 'section'
    if s in counts:
        counts[s] += 1
        s = f'{s}-{counts[s]}'
    else:
        counts[s] = 0
    return s


def body_html(md, slug):
    frag = pypandoc.convert_text(md, 'html5', format='gfm', extra_args=['--wrap=none'])
    soup = BeautifulSoup(frag, 'html.parser')
    counts, toc = {}, []
    for h in soup.find_all(re.compile(r'^h[1-6]$')):
        text = h.get_text(' ', strip=True)
        h['id'] = ID_OVERRIDES.get((slug, text)) or heading_id(text, counts)
        if h.name in ('h2', 'h3', 'h4'):
            toc.append((h.name, h['id'], text))
    for t in soup.find_all('table'):
        t['class'] = 'protocol-table'
        t.wrap(soup.new_tag('div', attrs={'class': 'table-wrap'}))
    # Copy-safe indices: B<sup>2.83</sup> is copied as "B^2.83", B<sub>min</sub> as "B_min".
    for tag, mark in (('sup', '^'), ('sub', '_')):
        for el in soup.find_all(tag):
            span = soup.new_tag('span', attrs={'class': 'copy-only'})
            span.string = mark
            el.insert(0, span)
    return str(soup).strip(), toc


def nav_html(active=None):
    return '''<nav class="site-nav" aria-label="Main navigation" dir="ltr">
  <div class="site-nav__inner">
    <a class="site-nav__brand" href="/">Dikenocracy</a>
    <ul class="site-nav__links" role="list">
      <li><a href="/pages/about.html">About</a></li>
      <li><a href="/pages/protocols.html" aria-current="page">Protocols</a></li>
      <li class="site-nav__has-menu">
        <span class="site-nav__parent"><a href="/pages/projects.html">Projects</a><button type="button" class="site-nav__submenu-toggle" aria-label="Show projects submenu" aria-controls="nav-projects-submenu" aria-expanded="false"><span class="site-nav__caret" aria-hidden="true"></span></button></span>
        <ul class="site-nav__submenu" id="nav-projects-submenu" role="list" hidden>
          <li><a href="/converter/index.html">Converter</a></li>
          <li><a href="/shadoo/">Shadoo</a></li>
          <li><a href="/ayalon/">Ayalon Monitor</a></li>
          <li><a href="/survival/">Survival Manual</a></li>
          <li><a href="/mazkira/">Mazkira — Business Assistant</a></li>
        </ul>
      </li>
    </ul>
  </div>
</nav>'''


def map_html(active_slug, prefix, indent='        '):
    out = [f'{indent}<aside class="protocol-map" aria-label="Protocol map">',
           f'{indent}  <div class="protocol-map__heading">Protocol Map</div>']
    for key, label, _ in LAYERS:
        items = [r for r in REGISTRY if r[1] == key]
        act = any(r[0] == active_slug for r in items)
        cls = 'protocol-map__layer-label' + (' protocol-map__layer-label--active' if act else '')
        out += [f'{indent}  <div class="protocol-map__layer">',
                f'{indent}    <span class="{cls}">{html.escape(label)}</span>',
                f'{indent}    <ul class="protocol-map__links">']
        for slug, _, short, _ in items:
            a = ' class="pmap-active"' if slug == active_slug else ''
            out.append(f'{indent}        <li><a href="{prefix}{slug}.html"{a}>{html.escape(short)}</a></li>')
        out += [f'{indent}    </ul>', f'{indent}  </div>']
    out.append(f'{indent}</aside>')
    return '\n'.join(out)


def side_nav(prev, nxt, docs):
    parts = ['  <div class="protocol-side-nav-layer" aria-hidden="true">']
    if prev:
        t = html.escape(docs[prev]['id'])
        parts.append(f'''    <div class="protocol-side-nav protocol-side-nav--prev">
      <a class="protocol-side-nav__btn" href="{prev}.html" aria-label="Previous protocol: {t}">
        <span class="nav-arrow">&lsaquo;</span>
        <span class="nav-label">{t}</span>
      </a>
    </div>''')
    if nxt:
        t = html.escape(docs[nxt]['id'])
        parts.append(f'''    <div class="protocol-side-nav protocol-side-nav--next">
      <a class="protocol-side-nav__btn" href="{nxt}.html" aria-label="Next protocol: {t}">
        <span class="nav-label">{t}</span>
        <span class="nav-arrow">&rsaquo;</span>
      </a>
    </div>''')
    parts.append('  </div>')
    return '\n'.join(parts)


def bottom_nav(prev, nxt, docs):
    a = (f'<a class="btn" href="{prev}.html" aria-label="Previous protocol: {html.escape(docs[prev]["id"])}">&larr; Previous Protocol</a>'
         if prev else '<span class="protocol-nav-bottom__spacer"></span>')
    b = (f'<a class="btn" href="{nxt}.html" aria-label="Next protocol: {html.escape(docs[nxt]["id"])}">Next Protocol &rarr;</a>'
         if nxt else '<span class="protocol-nav-bottom__spacer"></span>')
    return f'''        <nav class="protocol-nav-bottom" aria-label="Protocol navigation">
          {a}
          {b}
        </nav>'''


def meta_html(doc):
    lines = [f'<time datetime="{doc["last_updated"]}">{html.escape(format_date(doc["last_updated"]))}</time>']
    if doc.get('meta'):
        lines.append(html.escape(doc['meta']).replace(' · ', ' &middot; '))
    return '<br />\n            '.join(lines)


def page_html(slug, doc, prev, nxt, docs):
    title = doc['id']
    t = html.escape(title)
    body, toc = body_html(doc["body"], slug)
    toc_items = '\n'.join(
        f'          <li{"" if lvl == "h2" else " class=\"toc__sub\""}><a href="#{hid}">{html.escape(text)}</a></li>'
        for lvl, hid, text in toc)
    desc = 'Dikenocracy Protocol' if doc['kind'] == 'protocol' else 'Dikenocracy'
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="{t} — {desc}" />
  <title>{t} — Dikenocracy</title>
  <link rel="canonical" href="{DOMAIN}/pages/protocols/{slug}.html" />
  <link rel="icon" href="../../assets/favicon.ico" />
  <link rel="apple-touch-icon" href="../../assets/apple-touch-icon.png" />
  <meta property="og:title" content="{t} — Dikenocracy" />
  <meta property="og:description" content="{t} — Dikenocracy Protocol specification." />
  <meta property="og:image" content="{DOMAIN}/assets/main_screen.webp" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="{DOMAIN}/pages/protocols/{slug}.html" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="stylesheet" href="{CSS_MAIN}" />
  <link rel="stylesheet" href="{CSS_PROTOCOLS}" />
</head>
<body>

  <a href="#main" class="skip-link">Skip to content</a>

  {nav_html()}

{side_nav(prev, nxt, docs)}

  <main id="main">
    <div class="protocol-shell">
{map_html(slug, '')}
      <aside class="protocol-toc" aria-label="Table of contents">
        <button class="protocol-toc__toggle" aria-expanded="false" aria-controls="toc-list">
          <span>On This Page</span>
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
        <nav id="toc-list">
          <div class="protocol-toc__heading">On This Page</div>
          <ul class="protocol-toc__list">
{toc_items}
          </ul>
        </nav>
      </aside>
      <div class="protocol-content">
        <div class="protocol-toolbar">
          <a href="../protocols.html">&larr; All Protocols</a>
        </div>

        <article class="protocol-article">
          <h1>{t}</h1>
          <div class="protocol-meta">
            {meta_html(doc)}
          </div>
{body}
        </article>

{bottom_nav(prev, nxt, docs)}
      </div>
    </div>
  </main>

  <footer class="site-footer">
    <p>Dikenocracy &mdash; public framework. Built openly alongside the old world.</p>
  </footer>

  <script src="/script-20260923.js"></script>
  <script type="module" src="/navigation-20260923.js"></script>
</body>
</html>
'''


def index_html(docs, n, release, txt_name):
    sections = []
    for key, label, full in LAYERS:
        items = [r for r in REGISTRY if r[1] == key]
        hid = {'foundation': 'foundation-heading', 'appendix': 'appendix-heading'}.get(key, key.lower() + '-heading')
        cards = []
        for slug, _, short, sub in items:
            ident = 'Code of Planetary Synergy' if slug.startswith('code') else docs[slug]['id']
            if docs[slug]['kind'] == 'appendix':
                ident = 'Appendix A'
            cards.append(f'''        <a class="protocol-layer" href="protocols/{slug}.html">
          <div class="protocol-layer__id">{html.escape(ident)}</div>
          <div class="protocol-layer__name">{html.escape(sub)}</div>
        </a>''')
        text = f'''        <p class="section__text">
          {LAYER_TEXT[key]}
        </p>
''' if key in LAYER_TEXT else ''
        sections.append(f'''      <section class="section" aria-labelledby="{hid}">
        <h2 class="section__heading" id="{hid}">{html.escape(full)}</h2>
{text}
''' + '\n\n'.join(cards) + '\n      </section>')
    sec = '\n\n'.join(sections)
    txt_url = '/downloads/' + txt_name.replace(' ', '%20')
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Dikenocracy Protocols — layered, dated, auditable governance specifications." />
  <title>Protocols — Dikenocracy</title>
  <link rel="canonical" href="{DOMAIN}/pages/protocols.html" />
  <link rel="icon" href="../assets/favicon.ico" />
  <link rel="apple-touch-icon" href="../assets/apple-touch-icon.png" />
  <meta property="og:title" content="Protocols — Dikenocracy" />
  <meta property="og:description" content="{n} layered, auditable governance protocols." />
  <meta property="og:image" content="{DOMAIN}/assets/main_screen.webp" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{DOMAIN}/pages/protocols.html" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="stylesheet" href="{CSS_MAIN}" />
  <link rel="stylesheet" href="{CSS_PROTOCOLS}" />
</head>
<body>

  <a href="#main" class="skip-link">Skip to content</a>

  <!-- ─── Navigation ──────────────────────────────────────────────────────── -->
  {nav_html()}

  <!-- ─── Main Content ─────────────────────────────────────────────────────── -->
  <main id="main">
    <div class="protocol-shell">

      <!-- Protocol Map sidebar -->
{map_html(None, 'protocols/')}

      <!-- Main content area -->
      <div class="protocol-content">

      <!-- Hero -->
      <header class="hero">
        <h1 class="hero__title">Protocols</h1>
        <p class="hero__sub">Layered · Dated · Auditable</p>
      </header>

      <div class="divider"></div>

      <!-- Intro -->
      <section class="section" aria-labelledby="protocols-intro-heading">
        <h2 class="section__heading" id="protocols-intro-heading">Protocol Architecture</h2>
        <p class="section__text">
          The Dikenocracy framework is built through layered protocols. Each protocol
          defines a bounded part of the system and is designed to be testable and
          auditable. No higher-layer protocol may violate a lower-layer constraint.
        </p>
        <p class="section__text">
          Protocols are identified by their layer prefix (DKP-0 … DKP-8) and a
          functional code. Each document shows the date of its last edition
          (“Last updated”). Changes to normative content follow DKP-4-UPGRADE-001
          (proposal, simulation, audit, acceptance, activation window and rollback);
          the date identifies an edition and does not by itself certify a change.
        </p>
        <p class="section__text release-line">
          Current release: <time datetime="{release}">{release}</time> &middot;
          {n} protocols across 9 layers (L0–L8), plus the Code of Planetary Synergy,
          one addendum and one appendix.
        </p>
      </section>

{sec}

      <!-- Consolidated text -->
      <section class="section" aria-labelledby="download-heading">
        <h2 class="section__heading" id="download-heading">Complete text</h2>
        <p class="section__text">
          The full Code of Planetary Synergy, all {n} protocols, the CRISIS addendum, Appendix A and the glossary in one
          plain-text file (release <time datetime="{release}">{release}</time>).
        </p>
        <div class="entry-points">
          <a class="btn" href="{txt_url}" download>Download “{html.escape(txt_name)}”</a>
        </div>
      </section>

      <!-- Official Source -->
      <section class="section" aria-labelledby="source-heading">
        <h2 class="section__heading" id="source-heading">Official source</h2>
        <p class="section__text">
          All protocol specifications are maintained openly. The canonical texts are
          published in the World repository; the code of this website is in the
          Dikenocracy repository.
        </p>
        <div class="entry-points">
          <a
            class="btn"
            href="https://github.com/anahronic/World/tree/main/Dikenocracy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Canonical texts on GitHub
          </a>
          <a
            class="btn"
            href="https://github.com/anahronic/Dikenocracy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Website source
          </a>
        </div>
        <div class="info-note">
          Protocol files follow the naming convention
          <code>DKP-&lt;layer&gt;-&lt;domain&gt;-&lt;seq&gt;</code>.
          {n} protocols across 9 layers (L0–L8).
        </div>
      </section>

      </div><!-- /.protocol-content -->
    </div><!-- /.protocol-shell -->
  </main>

  <!-- ─── Footer ─────────────────────────────────────────────────────────────── -->
  <footer class="site-footer">
    <p>Dikenocracy &mdash; public framework. Built openly alongside the old world.</p>
  </footer>

  <script src="/script-20260923.js"></script>
  <script type="module" src="/navigation-20260923.js"></script>
</body>
</html>
'''


def update_sitemap(path, docs, release):
    s = path.read_text(encoding='utf-8')
    blocks = re.findall(r'  <url>.*?</url>\n', s, re.S)
    keep = [b for b in blocks if '/pages/protocols/' not in b]
    for i, b in enumerate(keep):
        if b.count('/pages/protocols.html'):
            keep[i] = re.sub(r'<lastmod>.*?</lastmod>', f'<lastmod>{release}</lastmod>', b)
    new = [f'''  <url>
    <loc>{DOMAIN}/pages/protocols/{slug}.html</loc>
    <lastmod>{docs[slug]["last_updated"]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
''' for slug, *_ in REGISTRY]
    out = s[:s.index('  <url>')] + ''.join(keep) + ''.join(new) + '</urlset>\n'
    path.write_text(out, encoding='utf-8', newline='\n')


# ── TXT and DOCX ───────────────────────────────────────────────────────────────

def to_plain(md):
    txt = pypandoc.convert_text(md, 'plain', format='gfm', extra_args=[
        '--wrap=none', '--columns=100',
        f'--lua-filter={TOOLS / "rawhtml_to_ast.lua"}', f'--lua-filter={TOOLS / "plain_text.lua"}'])
    txt = txt.replace('\r\n', '\n')
    return re.sub(r'\n{3,}', '\n\n', txt).strip() + '\n'


def build_txt(docs, ids, release, glossary_md):
    n = len(ids)
    bar = '=' * 100
    out, toc = [], []
    head = [bar, f'DIKENOCRACY — CODE OF PLANETARY SYNERGY AND {n} PROTOCOLS', bar, '',
            f'Release: {release}',
            f'Composition: Code of Planetary Synergy; {n} protocols L0–L8;',
            '             addendum DKP-4-CRISIS-001 (PATCH); Appendix A to DKP-5-TRANSPORT-001; Dikenocracy Glossary.',
            f'Counted protocols: {n} unique protocol IDs. The Code, the addendum, the appendix and the glossary',
            '                   are not protocols and are not counted.',
            'Canonical source: https://github.com/anahronic/World/tree/main/Dikenocracy (SHA256SUMS.txt)',
            'Website: https://dikenocracy.com/pages/protocols.html',
            'Each document shows its own "Last updated" date; the release date above is the date of this full release.',
            'Formula notation in this file: x^y = x to the power y, x_min = x with subscript "min".', '']
    parts = []

    def section(title, sub, body, doc=None):
        lines = [bar, title]
        if sub:
            lines.append(sub)
        if doc:
            lines.append(format_date(doc['last_updated']))
            if doc.get('meta'):
                lines.append(doc['meta'])
        lines += [bar, '', body]
        parts.append('\n'.join(lines))

    code = docs['code-of-planetary-synergy']
    toc.append('PART I.   CODE OF PLANETARY SYNERGY')
    section('PART I. CODE OF PLANETARY SYNERGY', None, to_plain(code['body']), code)

    toc.append(f'PART II.  PROTOCOLS L0–L8 ({n})')
    section(f'PART II. PROTOCOLS L0–L8 ({n} PROTOCOLS)', None, 'The protocols follow, layer by layer.\n')
    k = 0
    for key, label, full in LAYERS[1:-1]:
        toc.append(f'          {full}')
        for slug, lay, short, sub in REGISTRY:
            if lay != key:
                continue
            d = docs[slug]
            if d['kind'] == 'protocol':
                k += 1
                toc.append(f'            {k:2d}. {d["id"]} — {sub}')
                section(f'{k}. {d["id"]}', sub, to_plain(d['body']), d)
            else:
                toc.append(f'                Addendum: {d["id"]} — {sub}')
                section(f'ADDENDUM: {d["id"]}', sub + ' (not a separate protocol; not counted)', to_plain(d['body']), d)
    assert k == n
    toc.append('PART III. APPENDICES')
    for slug, lay, short, sub in REGISTRY:
        if lay == 'appendix':
            d = docs[slug]
            toc.append(f'          {d["id"]} — appendix to DKP-5-TRANSPORT-001')
            section(f'PART III. {d["id"]}', 'Appendix to DKP-5-TRANSPORT-001 (not counted as a protocol)', to_plain(d['body']), d)
    toc.append('PART IV.  GLOSSARY')
    section('PART IV. DIKENOCRACY GLOSSARY', None, to_plain(glossary_md))

    text = '\n'.join(head) + '\n' + '\n'.join(['TABLE OF CONTENTS', ''] + toc) + '\n\n' + '\n\n'.join(parts) + '\n' + bar + '\nEND OF RELEASE ' + release + '\n'
    return text


def build_docx(docs):
    for d in docs.values():
        out = d['path'].with_suffix('.docx')
        md = f'# {d["id"]}\n\n*{format_date(d["last_updated"])}*' + (f' · {d["meta"]}' if d.get('meta') else '') + '\n\n' + d['body']
        pypandoc.convert_text(md, 'docx', format='gfm', outputfile=str(out),
                              extra_args=[f'--lua-filter={TOOLS / "rawhtml_to_ast.lua"}'])


def sha256(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--world', required=True, type=pathlib.Path)
    ap.add_argument('--release-date', required=True)
    ap.add_argument('--docx', action='store_true')
    ap.add_argument('--txt-copy', action='append', default=[], type=pathlib.Path)
    a = ap.parse_args()
    date.fromisoformat(a.release_date)
    docs = load_sources(a.world)
    ids = protocol_ids(docs)
    n = len(ids)
    txt_name = f'Dikenocracy SYNERGY and {n} PROTOCOLS.txt'

    out = SITE / 'pages' / 'protocols'
    slugs = [r[0] for r in REGISTRY]
    for i, slug in enumerate(slugs):
        prev = slugs[i - 1] if i else None
        nxt = slugs[i + 1] if i + 1 < len(slugs) else None
        (out / f'{slug}.html').write_text(page_html(slug, docs[slug], prev, nxt, docs), encoding='utf-8', newline='\n')
    (SITE / 'pages' / 'protocols.html').write_text(index_html(docs, n, a.release_date, txt_name), encoding='utf-8', newline='\n')
    (out / 'manifest.txt').write_text(''.join(f'{s}\t{docs[s]["id"]}\n' for s in slugs), encoding='utf-8', newline='\n')
    update_sitemap(SITE / 'sitemap.xml', docs, a.release_date)

    glossary = (a.world / 'Dikenocracy' / 'Dikenocracy Glossary.md').read_text(encoding='utf-8')
    txt = build_txt(docs, ids, a.release_date, glossary)
    dl = SITE / 'downloads'
    dl.mkdir(exist_ok=True)
    for old in dl.glob('Dikenocracy SYNERGY and * PROTOCOLS.txt'):
        old.unlink()
    txt_path = dl / txt_name
    # UTF-8 with BOM: the server sends text/plain without a charset, and the BOM makes
    # browsers that open the file inline decode δίκη, ≥, ± etc. correctly.
    txt_path.write_bytes(txt.encode('utf-8-sig'))
    copies = [a.world / txt_name] + [c / txt_name if c.is_dir() else c for c in a.txt_copy]
    for c in copies:
        shutil.copyfile(txt_path, c)

    if a.docx:
        build_docx(docs)

    lines = [f'{sha256(d["path"])}  {d["path"].relative_to(a.world).as_posix()}' for d in docs.values()]
    lines.append(f'{sha256(a.world / "Dikenocracy" / "Dikenocracy Glossary.md")}  Dikenocracy/Dikenocracy Glossary.md')
    lines.append(f'{sha256(txt_path)}  {txt_name}')
    (a.world / 'SHA256SUMS.txt').write_text(f'# Dikenocracy release {a.release_date}\n' + '\n'.join(sorted(lines, key=lambda l: l[66:])) + '\n',
                                            encoding='utf-8', newline='\n')
    print(f'protocols={n} documents={len(docs)} txt={txt_name} sha256={sha256(txt_path)}')


if __name__ == '__main__':
    main()
