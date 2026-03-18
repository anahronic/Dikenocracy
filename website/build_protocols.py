#!/usr/bin/env python3
"""
Convert the protocols source markdown into individual HTML pages.
Reads:  website/assets/Dikenocracy SYNERGY and 31 PROTOCOLS .md
Writes: website/pages/protocols/*.html

Features:
  - Splits on protocol boundaries (H1, H2-DKP, bare DKP, bold DKP)
  - Cleans markdown artifacts (escaped heading numbers, stray markers)
  - Generates heading IDs for table-of-contents anchoring
  - Adds left-side TOC sidebar per protocol page
  - Adds Previous / Next protocol navigation with image buttons
  - Proper heading hierarchy (h1 = page title, h2+ = content)
"""
import re, html, pathlib

BASE_DIR = pathlib.Path(__file__).resolve().parent
SRC = BASE_DIR / "assets" / "Dikenocracy SYNERGY and 31 PROTOCOLS .md"
OUT = BASE_DIR / "pages" / "protocols"
OUT.mkdir(parents=True, exist_ok=True)

DOMAIN = "https://dikenocracy.com"

lines = SRC.read_text(encoding="utf-8").splitlines()

# ── Pattern for DKP protocol identifiers ────────────────────────────────────
DKP_PAT = r'DKP-\d+(?:-[A-Z]+)+-\d+'

def is_boundary(line: str) -> bool:
    if re.match(r'^# ', line):
        return True
    if re.match(rf'^##\s+\**{DKP_PAT}', line):
        return True
    if re.match(rf'^{DKP_PAT}\s*$', line):
        return True
    if re.match(rf'^\*\*{DKP_PAT}\*\*\s*$', line):
        return True
    return False

def extract_title(line: str) -> str:
    s = line.strip()
    s = re.sub(r'^#{1,6}\s+', '', s)
    s = s.strip('*').strip()
    return s

def make_slug(title: str) -> str:
    s = title.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = s.strip('-')
    return s or 'index'

# ── Identify protocol boundaries ────────────────────────────────────────────
boundaries = []
for i, line in enumerate(lines):
    if is_boundary(line):
        boundaries.append(i)
boundaries.append(len(lines))

blocks = []
for j in range(len(boundaries) - 1):
    start = boundaries[j]
    end = boundaries[j + 1]
    title_raw = extract_title(lines[start])
    body_lines = lines[start:end]
    blocks.append((title_raw, body_lines))


# ── Heading ID generator ───────────────────────────────────────────────────
_id_counts = {}

def heading_id(text):
    """Generate a unique slug from heading text for anchor linking."""
    s = re.sub(r'<[^>]+>', '', text)  # strip HTML tags
    s = re.sub(r'[^a-z0-9\s-]', '', s.lower())
    s = re.sub(r'[\s]+', '-', s.strip())
    s = s[:60].rstrip('-') or 'section'
    if s in _id_counts:
        _id_counts[s] += 1
        s = f"{s}-{_id_counts[s]}"
    else:
        _id_counts[s] = 0
    return s


# ── Clean text helpers ──────────────────────────────────────────────────────
def clean_heading_text(s):
    """Remove markdown artifacts from heading text."""
    s = re.sub(r'(\d+)\\\.', r'\1.', s)
    s = s.strip('*').strip()
    s = s.replace('\\', '')
    return s

def inline(s):
    """Convert inline markdown to HTML."""
    s = re.sub(r'\*\*\*(.+?)\*\*\*', r'<strong><em>\1</em></strong>', s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<em>\1</em>', s)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\[!\[.*?\]\(.*?\)\]\(.*?\)', '', s)
    s = re.sub(r'!\[.*?\]\(.*?\)', '', s)
    s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', s)
    s = re.sub(r'\[image\d+\]', '', s)
    s = re.sub(r'(\d+)\\\.', r'\1.', s)
    s = s.replace('\\', '')
    if s.strip() == '*':
        return ''
    return s


# ── Legacy metadata patterns (to strip from source) ────────────────────────
# These appear in the source MD as inline version/status/layer blocks that we
# replace with the standardized protocol-meta div in the template.
_META_PATTERNS = [
    # "Version: X.X  Status: ... Layer: ..." (all on one line)
    re.compile(r'^(?:\*\*)?Version:?\*?\*?\s*:?\s*\d+\.\d+', re.IGNORECASE),
    # "Status: Architecture Lock ..." standalone line
    re.compile(r'^\s*\*?\*?Status:?\*?\*?\s*:', re.IGNORECASE),
    # "Layer: LX ..." standalone line
    re.compile(r'^\s*\*?\*?Layer:?\*?\*?\s*:', re.IGNORECASE),
    # "Anchored to: ..." standalone line
    re.compile(r'^\s*\*?\*?Anchored to:?\*?\*?\s*:', re.IGNORECASE),
    # "### **Version 1.0**" heading
    re.compile(r'^#{1,6}\s+\*?\*?Version\s+\d', re.IGNORECASE),
    # "**Version 1.0**" bold standalone
    re.compile(r'^\*\*Version\s+\d.*\*\*\s*$', re.IGNORECASE),
]

def _is_legacy_meta(line):
    """Return True if line is a legacy metadata block to strip."""
    s = line.strip()
    if not s:
        return False
    for pat in _META_PATTERNS:
        if pat.search(s):
            return True
    return False


# ── Markdown to HTML converter ──────────────────────────────────────────────
def md_to_html(md_lines):
    """Convert markdown lines to HTML. Returns (html_string, toc_entries).
    toc_entries = [(level, id, text), ...]"""

    # Strip legacy metadata lines before conversion
    md_lines = [l for l in md_lines if not _is_legacy_meta(l)]

    out = []
    toc = []
    in_ul = False
    in_ol = False
    in_table = False
    in_code = False
    buffer = []
    prev_was_hr = False

    def flush_para():
        nonlocal buffer
        if buffer:
            text = " ".join(buffer).strip()
            text = inline(text)
            if text and text.strip():
                out.append(f"<p>{text}</p>")
            buffer = []

    def close_list():
        nonlocal in_ul, in_ol
        if in_ul:
            out.append("</ul>")
            in_ul = False
        if in_ol:
            out.append("</ol>")
            in_ol = False

    total_lines = len(md_lines)
    for idx, raw in enumerate(md_lines):
        line = raw.rstrip()

        # code fence
        if line.startswith('```'):
            if in_code:
                out.append("</pre>")
                in_code = False
            else:
                flush_para()
                close_list()
                out.append("<pre>")
                in_code = True
            continue
        if in_code:
            out.append(html.escape(line))
            continue

        # blank line
        if not line.strip():
            flush_para()
            if in_table:
                out.append("</tbody></table>")
                in_table = False
            continue

        # table row
        if '|' in line and line.strip().startswith('|'):
            cells = [c.strip() for c in line.strip().strip('|').split('|')]
            if all(re.match(r'^[-: ]+$', c) for c in cells):
                continue
            flush_para()
            close_list()
            if not in_table:
                out.append('<div class="table-wrap"><table class="protocol-table"><thead><tr>')
                for c in cells:
                    out.append(f"<th>{inline(c)}</th>")
                out.append("</tr></thead><tbody>")
                in_table = True
            else:
                out.append("<tr>")
                for c in cells:
                    out.append(f"<td>{inline(c)}</td>")
                out.append("</tr>")
            continue

        # heading
        m = re.match(r'^(#{1,6})\s*(.*)', line)
        if m:
            text = clean_heading_text(m.group(2))
            # Skip bare heading markers (e.g. lone "###" with no text)
            if not text:
                continue
            flush_para()
            close_list()
            level = len(m.group(1))
            h = min(level + 1, 4)
            hid = heading_id(text)
            out.append(f'<h{h} id="{hid}">{inline(text)}</h{h}>')
            toc.append((h, hid, re.sub(r'<[^>]+>', '', inline(text))))
            prev_was_hr = False
            continue

        # horizontal rule — skip duplicates (handles both --- and \---)
        if re.match(r'^\\?---+$', line.strip()):
            flush_para()
            close_list()
            if not prev_was_hr:
                out.append('<hr />')
                prev_was_hr = True
            continue
        prev_was_hr = False

        # Standalone numbered section heading: "0\. Preamble", "1\. Purpose", etc.
        # These are on their own line in the source — not part of ordered lists
        m_sec = re.match(r'^(\d+)\\\. (.+)$', line)
        if m_sec:
            flush_para()
            close_list()
            num = m_sec.group(1)
            text = clean_heading_text(m_sec.group(2))
            hid = heading_id(f'{num}. {text}')
            out.append(f'<h2 id="{hid}">{inline(f"{num}. {text}")}</h2>')
            toc.append((2, hid, f'{num}. ' + re.sub(r'<[^>]+>', '', inline(text))))
            prev_was_hr = False
            continue

        # unordered list
        m_ul = re.match(r'^[\*\-]\s+(.*)', line)
        if m_ul:
            flush_para()
            if in_ol:
                out.append("</ol>")
                in_ol = False
            if not in_ul:
                out.append("<ul>")
                in_ul = True
            out.append(f"<li>{inline(m_ul.group(1))}</li>")
            continue

        # ordered list — but detect standalone section headings first
        m_ol = re.match(r'^(\d+)[\.\)]\s+(.*)', line)
        if m_ol:
            num_text = m_ol.group(2).strip()
            word_count = len(num_text.split())
            # Heuristic: a numbered line is a section heading if:
            #  - short (1-6 words), starts uppercase, no markdown formatting
            #  - AND followed by blank line or indented body (standalone heading)
            #  - AND we're not already inside an ordered list
            next_line = md_lines[idx + 1].rstrip() if idx + 1 < total_lines else ''
            next_is_body = (idx + 1 >= total_lines
                           or next_line.strip() == ''
                           or next_line.startswith('   '))
            no_formatting = not re.search(r'[*#\[\]`]', num_text)
            if (word_count <= 6 and num_text[:1].isupper()
                    and no_formatting and next_is_body and not in_ol):
                flush_para()
                close_list()
                num = m_ol.group(1)
                text = clean_heading_text(num_text)
                hid = heading_id(f'{num}. {text}')
                out.append(f'<h2 id="{hid}">{inline(f"{num}. {text}")}</h2>')
                toc.append((2, hid, f'{num}. ' + re.sub(r'<[^>]+>', '', inline(text))))
                prev_was_hr = False
                continue
            flush_para()
            if in_ul:
                out.append("</ul>")
                in_ul = False
            if not in_ol:
                out.append("<ol>")
                in_ol = True
            out.append(f"<li>{inline(m_ol.group(2))}</li>")
            continue

        # Close list if current line is not a list item
        if (in_ul or in_ol) and not line.startswith(' '):
            close_list()

        # blockquote
        if line.startswith('>'):
            flush_para()
            close_list()
            out.append(f"<blockquote>{inline(line[1:].strip())}</blockquote>")
            continue

        # Skip stray lone asterisks
        if line.strip() in ('*', '**'):
            continue

        # paragraph continuation
        buffer.append(line)

    flush_para()
    close_list()
    if in_table:
        out.append("</tbody></table></div>")

    # Post-process TOC: only include h4 entries if no h2 entries exist
    # (meaning ### is the top-level heading for this protocol)
    has_h2 = any(level == 2 for level, _, _ in toc)
    if has_h2:
        toc = [(level, hid, text) for level, hid, text in toc if level <= 3]

    return "\n".join(out), toc


# ── Build TOC sidebar HTML ──────────────────────────────────────────────────
def toc_html(entries):
    if not entries:
        return ''
    items = []
    for level, hid, text in entries:
        indent_cls = ' class="toc__sub"' if level >= 3 else ''
        items.append(f'          <li{indent_cls}><a href="#{hid}">{html.escape(text)}</a></li>')
    return "\n".join(items)


# ── Page HTML template ──────────────────────────────────────────────────────

# Protocol layer map for global navigation sidebar
PROTOCOL_LAYERS = [
    ("Foundation", [
        ("code-of-planetary-synergy", "Synergy Code"),
    ]),
    ("L0 — Physical Truth", [
        ("dkp-0-oracle-001", "ORACLE"),
        ("dkp-0-time-001", "TIME"),
    ]),
    ("L1 — Core", [
        ("dkp-1-axioms-001", "AXIOMS"),
        ("dkp-1-identity-001", "IDENTITY"),
        ("dkp-1-impact-001", "IMPACT"),
        ("dkp-1-justice-001", "JUSTICE"),
    ]),
    ("L2 — Economic", [
        ("dkp-2-assets-001", "ASSETS"),
        ("dkp-2-finance-001", "FINANCE"),
        ("dkp-2-labor-001", "LABOR"),
    ]),
    ("L3 — Security", [
        ("dkp-3-antiterror-001", "ANTITERROR"),
        ("dkp-3-defense-001", "DEFENSE"),
        ("dkp-3-internal-sec-001", "INTERNAL-SEC"),
        ("dkp-3-police-001", "POLICE"),
    ]),
    ("L4 — Stability", [
        ("dkp-4-crisis-001", "CRISIS"),
        ("dkp-4-error-001", "ERROR"),
        ("dkp-4-upgrade-001", "UPGRADE"),
    ]),
    ("L5 — Human Infra", [
        ("dkp-5-culture-001", "CULTURE"),
        ("dkp-5-edu-001", "EDU"),
        ("dkp-5-habitat-001", "HABITAT"),
        ("dkp-5-info-001", "INFO"),
        ("dkp-5-transport-001", "TRANSPORT"),
        ("dkp-5-work-cycle-001", "WORK-CYCLE"),
    ]),
    ("L6 — Intersystem", [
        ("dkp-6-exit-001", "EXIT"),
        ("dkp-6-integration-001", "INTEGRATION"),
    ]),
    ("L7 — Meta / Scope", [
        ("dkp-7-ai-subject-001", "AI-SUBJECT"),
        ("dkp-7-privacy-001", "PRIVACY"),
        ("dkp-7-scope-001", "SCOPE"),
        ("dkp-7-transparency-001", "TRANSPARENCY"),
    ]),
    ("L8 — Infrastructure", [
        ("dkp-8-audit-001", "AUDIT"),
        ("dkp-8-interop-001", "INTEROP"),
        ("dkp-8-simulation-001", "SIMULATION"),
    ]),
    ("Appendix", [
        ("appendix-a-design-rationale-safeguards-normative", "Appendix A"),
    ]),
]

def protocol_map_html(current_slug):
    """Build the global protocol layer navigation sidebar."""
    parts = []
    parts.append('      <aside class="protocol-map" aria-label="Protocol map">')
    parts.append('        <div class="protocol-map__heading">Protocol Map</div>')
    for layer_name, protocols in PROTOCOL_LAYERS:
        # Check if current protocol is in this layer
        layer_active = any(slug == current_slug for slug, _ in protocols)
        label_cls = ' protocol-map__layer-label--active' if layer_active else ''
        parts.append(f'        <div class="protocol-map__layer">')
        parts.append(f'          <span class="protocol-map__layer-label{label_cls}">{html.escape(layer_name)}</span>')
        parts.append(f'          <ul class="protocol-map__links">')
        for slug, short_name in protocols:
            active_cls = ' class="pmap-active"' if slug == current_slug else ''
            parts.append(f'            <li><a href="{slug}.html"{active_cls}>{html.escape(short_name)}</a></li>')
        parts.append(f'          </ul>')
        parts.append(f'        </div>')
    parts.append('      </aside>')
    return "\n".join(parts)


def page_html(title, body_html, slug, toc_items,
              prev_slug, prev_title, next_slug, next_title):
    esc_title = html.escape(title)
    canon = f"{DOMAIN}/pages/protocols/{slug}.html"

    # Fixed side prev/next navigation
    side_nav = []
    if prev_slug:
        esc_prev = html.escape(prev_title or "")
        side_nav.append(f'  <div class="protocol-side-nav protocol-side-nav--prev">')
        side_nav.append(f'    <a class="protocol-side-nav__btn" href="{prev_slug}.html" aria-label="Previous protocol: {esc_prev}">')
        side_nav.append(f'      <span class="nav-arrow">&lsaquo;</span>')
        side_nav.append(f'      <span class="nav-label">{esc_prev}</span>')
        side_nav.append(f'    </a>')
        side_nav.append(f'  </div>')
    if next_slug:
        esc_next = html.escape(next_title or "")
        side_nav.append(f'  <div class="protocol-side-nav protocol-side-nav--next">')
        side_nav.append(f'    <a class="protocol-side-nav__btn" href="{next_slug}.html" aria-label="Next protocol: {esc_next}">')
        side_nav.append(f'      <span class="nav-label">{esc_next}</span>')
        side_nav.append(f'      <span class="nav-arrow">&rsaquo;</span>')
        side_nav.append(f'    </a>')
        side_nav.append(f'  </div>')
    side_nav_html = "\n".join(side_nav)

    # Bottom inline nav (text buttons)
    bottom_nav = []
    bottom_nav.append('        <nav class="protocol-nav-bottom" aria-label="Protocol navigation">')
    if prev_slug:
        esc_prev = html.escape(prev_title or "")
        bottom_nav.append(f'          <a class="btn" href="{prev_slug}.html" aria-label="Previous protocol: {esc_prev}">&larr; Previous Protocol</a>')
    else:
        bottom_nav.append(f'          <span class="protocol-nav-bottom__spacer"></span>')
    if next_slug:
        esc_next = html.escape(next_title or "")
        bottom_nav.append(f'          <a class="btn" href="{next_slug}.html" aria-label="Next protocol: {esc_next}">Next Protocol &rarr;</a>')
    else:
        bottom_nav.append(f'          <span class="protocol-nav-bottom__spacer"></span>')
    bottom_nav.append('        </nav>')
    bottom_nav_html = "\n".join(bottom_nav)

    # Global protocol map
    pmap_html = protocol_map_html(slug)

    # TOC sidebar
    toc_block = ''
    if toc_items:
        toc_block = f'''      <aside class="protocol-toc" aria-label="Table of contents">
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
      </aside>'''

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="{esc_title} — Dikenocracy Protocol" />
  <title>{esc_title} — Dikenocracy</title>
  <link rel="canonical" href="{canon}" />
  <link rel="icon" href="../../assets/favicon.ico" />
  <link rel="apple-touch-icon" href="../../assets/apple-touch-icon.png" />
  <meta property="og:title" content="{esc_title} — Dikenocracy" />
  <meta property="og:description" content="{esc_title} — Dikenocracy Protocol specification." />
  <meta property="og:image" content="{DOMAIN}/assets/main_screen.webp" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="{canon}" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="stylesheet" href="../../styles.css" />
</head>
<body>

  <a href="#main" class="skip-link">Skip to content</a>

  <nav class="site-nav" aria-label="Main navigation">
    <div class="site-nav__inner">
      <a class="site-nav__brand" href="../../index.html">Dikenocracy</a>
      <button class="site-nav__toggle" aria-label="Toggle navigation" aria-expanded="false" aria-controls="site-nav-links">
        <span></span><span></span><span></span>
      </button>
      <ul class="site-nav__links" id="site-nav-links" role="list">
        <li><a href="../about.html">About</a></li>
        <li><a href="../protocols.html" aria-current="page">Protocols</a></li>
        <li><a href="../projects.html">Projects</a></li>
        <li><a href="../converter.html">Converter</a></li>
      </ul>
    </div>
  </nav>

{side_nav_html}

  <main id="main">
    <div class="protocol-shell">
{pmap_html}
{toc_block}
      <div class="protocol-content">
        <div class="protocol-toolbar">
          <a href="../protocols.html">&larr; All Protocols</a>
        </div>

        <article class="protocol-article">
          <h1>{esc_title}</h1>
          <div class="protocol-meta">Version: 1.0 &middot; Status: Freeze</div>
{body_html}
        </article>

{bottom_nav_html}
      </div>
    </div>
  </main>

  <footer class="site-footer">
    <p>Dikenocracy &mdash; public framework. Built openly alongside the old world.</p>
  </footer>

  <script src="../../script.js"></script>
</body>
</html>'''


# ── Generate pages ──────────────────────────────────────────────────────────
manifest = []

# First pass: collect valid blocks
valid_blocks = []
for title, body_lines in blocks:
    slug = make_slug(title)
    if slug == 'dikenocracy' and len(body_lines) < 5:
        print(f"  skipped {slug} (title-only stub)")
        continue
    valid_blocks.append((title, slug, body_lines))

# Second pass: generate with prev/next
for idx, (title, slug, body_lines) in enumerate(valid_blocks):
    _id_counts.clear()
    # Skip the boundary/title line — it's already used as the page <h1>
    body_html, toc_entries = md_to_html(body_lines[1:])
    toc_items = toc_html(toc_entries)

    prev_slug = valid_blocks[idx - 1][1] if idx > 0 else None
    prev_title = valid_blocks[idx - 1][0] if idx > 0 else None
    next_slug = valid_blocks[idx + 1][1] if idx < len(valid_blocks) - 1 else None
    next_title = valid_blocks[idx + 1][0] if idx < len(valid_blocks) - 1 else None

    page = page_html(title, body_html, slug, toc_items,
                     prev_slug, prev_title, next_slug, next_title)
    outfile = OUT / f"{slug}.html"
    outfile.write_text(page, encoding="utf-8")
    manifest.append((slug, title))
    print(f"  wrote {outfile.name} ({len(body_lines)} lines, {len(toc_entries)} TOC entries)")

# ── Write manifest ──────────────────────────────────────────────────────────
manifest_path = OUT / "manifest.txt"
with open(manifest_path, "w") as f:
    for slug, title in manifest:
        f.write(f"{slug}\t{title}\n")

print(f"\nDone: {len(manifest)} pages written to {OUT}")
