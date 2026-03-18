#!/usr/bin/env python3
"""
Convert the protocols source markdown into individual HTML pages.
Reads: website/assets/Dikenocracy SYNERGY and 31 PROTOCOLS .md
Writes: website/pages/protocols/*.html

Splits on EVERY protocol boundary:
  - H1 headings  (^# )
  - H2 DKP headings  (^## **DKP-…)
  - Bare DKP protocol ID lines  (^DKP-N-NAME-NNN\s*$)
  - Bold DKP protocol ID lines  (^**DKP-N-NAME-NNN**\s*$)
"""
import re, html, textwrap, pathlib

BASE_DIR = pathlib.Path(__file__).resolve().parent
SRC = BASE_DIR / "assets" / "Dikenocracy SYNERGY and 31 PROTOCOLS .md"
OUT = BASE_DIR / "pages" / "protocols"
OUT.mkdir(parents=True, exist_ok=True)

lines = SRC.read_text(encoding="utf-8").splitlines()

# ── Pattern for DKP protocol identifiers (handles multi-word names) ─────────
DKP_PAT = r'DKP-\d+(?:-[A-Z]+)+-\d+'

def is_boundary(line: str) -> bool:
    """Return True if *line* starts a new protocol / top-level section."""
    # Any H1 heading
    if re.match(r'^# ', line):
        return True
    # H2 heading that contains a DKP id  (e.g.  ## **DKP-8-INTEROP-001**)
    if re.match(rf'^##\s+\**{DKP_PAT}', line):
        return True
    # Bare protocol id on its own line  (e.g.  DKP-5-CULTURE-001)
    if re.match(rf'^{DKP_PAT}\s*$', line):
        return True
    # Bold protocol id on its own line  (e.g.  **DKP-7-AI-SUBJECT-001**)
    if re.match(rf'^\*\*{DKP_PAT}\*\*\s*$', line):
        return True
    return False

def extract_title(line: str) -> str:
    """Pull a clean title string from a boundary line."""
    s = line.strip()
    # strip leading markdown heading markers
    s = re.sub(r'^#{1,6}\s+', '', s)
    # strip bold markers
    s = s.strip('*').strip()
    # strip surrounding whitespace
    return s

# ── Identify ALL protocol boundaries ────────────────────────────────────────
boundaries = []
for i, line in enumerate(lines):
    if is_boundary(line):
        boundaries.append(i)
boundaries.append(len(lines))

# ── Build protocol blocks ───────────────────────────────────────────────────
blocks = []
for j in range(len(boundaries) - 1):
    start = boundaries[j]
    end = boundaries[j + 1]
    title_raw = extract_title(lines[start])
    body_lines = lines[start:end]
    blocks.append((title_raw, body_lines))

# ── Markdown → HTML (lightweight, no dependencies) ──────────────────────────
def md_to_html(md_lines: list[str]) -> str:
    """Very simple markdown to HTML converter — handles headings, paragraphs,
    lists, bold/italic, code, tables, and blockquotes."""
    out = []
    in_list = False
    in_table = False
    in_code = False
    buffer = []

    def flush_para():
        nonlocal buffer
        if buffer:
            text = " ".join(buffer).strip()
            if text:
                out.append(f"<p>{inline(text)}</p>")
            buffer = []

    def inline(s):
        # escape first, then apply inline formatting
        # bold+italic
        s = re.sub(r'\*\*\*(.+?)\*\*\*', r'<strong><em>\1</em></strong>', s)
        # bold
        s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
        # italic
        s = re.sub(r'\*(.+?)\*', r'<em>\1</em>', s)
        # inline code
        s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
        # images (linked)
        s = re.sub(r'\[!\[.*?\]\(.*?\)\]\(.*?\)', '', s)  # remove equation images
        # remaining image refs
        s = re.sub(r'!\[.*?\]\(.*?\)', '', s)
        # links
        s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', s)
        # image placeholders like [image1]
        s = re.sub(r'\[image\d+\]', '', s)
        return s

    for raw in md_lines:
        line = raw.rstrip()

        # code fence
        if line.startswith('```'):
            if in_code:
                out.append("</pre>")
                in_code = False
            else:
                flush_para()
                lang = line[3:].strip()
                out.append(f"<pre>")
                in_code = True
            continue
        if in_code:
            out.append(html.escape(line))
            continue

        # blank line
        if not line.strip():
            flush_para()
            if in_list:
                out.append("</ul>")
                in_list = False
            if in_table:
                out.append("</tbody></table>")
                in_table = False
            continue

        # table row
        if '|' in line and line.strip().startswith('|'):
            cells = [c.strip() for c in line.strip().strip('|').split('|')]
            # separator row (---|---|---)
            if all(re.match(r'^[-: ]+$', c) for c in cells):
                continue
            flush_para()
            if not in_table:
                out.append('<table class="protocol-table"><thead><tr>')
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
        m = re.match(r'^(#{1,6})\s+(.*)', line)
        if m:
            flush_para()
            if in_list:
                out.append("</ul>")
                in_list = False
            level = len(m.group(1))
            text = m.group(2).strip().strip("*")
            # keep headings at h2-h4 range for page hierarchy
            h = min(level + 1, 4)
            out.append(f"<h{h}>{inline(text)}</h{h}>")
            continue

        # horizontal rule
        if re.match(r'^---+$', line.strip()):
            flush_para()
            out.append("<hr />")
            continue

        # unordered list
        m = re.match(r'^[\*\-]\s+(.*)', line)
        if m:
            flush_para()
            if not in_list:
                out.append("<ul>")
                in_list = True
            out.append(f"<li>{inline(m.group(1))}</li>")
            continue

        # ordered list
        m = re.match(r'^\d+[\.\)]\s+(.*)', line)
        if m:
            flush_para()
            if not in_list:
                out.append("<ul>")
                in_list = True
            out.append(f"<li>{inline(m.group(1))}</li>")
            continue

        # blockquote
        if line.startswith('>'):
            flush_para()
            out.append(f"<blockquote>{inline(line[1:].strip())}</blockquote>")
            continue

        # paragraph continuation
        buffer.append(line)

    flush_para()
    if in_list:
        out.append("</ul>")
    if in_table:
        out.append("</tbody></table>")

    return "\n".join(out)


# ── HTML template ───────────────────────────────────────────────────────────
DOMAIN = "https://dikenocracy.com"

def page_html(title: str, body_html: str, slug: str) -> str:
    esc_title = html.escape(title)
    canon = f"{DOMAIN}/pages/protocols/{slug}.html"
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

  <main id="main">
    <div class="page-wrapper">
      <p style="margin-bottom:var(--gap-md)"><a href="../protocols.html">&larr; All Protocols</a></p>

      <article class="protocol-article">
        <h1>{esc_title}</h1>
{body_html}
      </article>
    </div>
  </main>

  <footer class="site-footer">
    <p>Dikenocracy &mdash; public framework. Built openly alongside the old world.</p>
  </footer>

  <script src="../../script.js"></script>
</body>
</html>'''

# ── Slug mapping ────────────────────────────────────────────────────────────
def make_slug(title: str) -> str:
    s = title.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = s.strip('-')
    return s or 'index'

# ── Generate pages ──────────────────────────────────────────────────────────
manifest = []  # (slug, title) for index page

for title, body_lines in blocks:
    slug = make_slug(title)
    # Skip the title-only stub ("Dikenocracy" — 2 lines, no real content)
    if slug == 'dikenocracy' and len(body_lines) < 5:
        print(f"  skipped {slug} (title-only stub)")
        continue
    body_html = md_to_html(body_lines)
    page = page_html(title, body_html, slug)
    outfile = OUT / f"{slug}.html"
    outfile.write_text(page, encoding="utf-8")
    manifest.append((slug, title))
    print(f"  wrote {outfile.name} ({len(body_lines)} lines)")

# ── Write manifest for the index page ──────────────────────────────────────
manifest_path = OUT / "manifest.txt"
with open(manifest_path, "w") as f:
    for slug, title in manifest:
        f.write(f"{slug}\t{title}\n")

print(f"\nDone: {len(manifest)} pages written to {OUT}")
