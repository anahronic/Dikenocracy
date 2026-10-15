"""Applies the shared page chrome to the hand-written pages: navigation (with the current section marked),
footer, stylesheet name, site script and OG image. The protocol pages get the same chrome from build_release.py.

    python website/tools/apply_chrome.py [file_or_dir ...]
Without arguments: every *.html of website/ except the generated protocol pages.
Idempotent: running it twice changes nothing.
"""
import pathlib
import re
import sys

SITE = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SITE))
from build_release import CSS_MAIN, FOOTER_HTML, OG_IMAGE, nav_html  # noqa: E402

NAV_RE = re.compile(r'<nav class="site-nav".*?</nav>', re.S)
FOOTER_RE = re.compile(r'<footer class="site-footer"[^>]*>.*?</footer>', re.S)
CSS_RE = re.compile(r'<link rel="stylesheet" href="/(?:styles|protocols)-\d{8}\.css" />\n?')
SITE_JS = '<script src="/site-20261015.js" defer></script>'


def section(rel: str):
    if rel == 'pages/about.html':
        return 'about'
    if rel.startswith(('pages/projects', 'converter/', 'pages/converter')):
        return 'projects'
    return None


def apply(html: str, rel: str) -> str:
    html = NAV_RE.sub(lambda m: nav_html(section(rel)), html, count=1)
    html = FOOTER_RE.sub(lambda m: FOOTER_HTML, html, count=1)
    first = [True]

    def css(m):
        if first[0]:
            first[0] = False
            return f'<link rel="stylesheet" href="{CSS_MAIN}" />\n'
        return ''
    html = CSS_RE.sub(css, html)
    html = re.sub(r'https://dikenocracy\.com/assets/(?:main_screen\.webp|og-\d{8}\.jpg)', 'https://dikenocracy.com' + OG_IMAGE, html)
    if SITE_JS not in html:
        html = html.replace('</body>', f'  {SITE_JS}\n</body>', 1)
    return html


def targets(args):
    if args:
        for a in args:
            p = pathlib.Path(a)
            yield from (sorted(p.rglob('*.html')) if p.is_dir() else [p])
        return
    for p in sorted(SITE.rglob('*.html')):
        rel = p.relative_to(SITE).as_posix()
        if rel.startswith(('pages/protocols/', 'tools/')) or rel == 'pages/protocols.html':
            continue
        yield p


changed = 0
for p in targets(sys.argv[1:]):
    s = p.read_text(encoding='utf-8')
    new = apply(s, p.resolve().relative_to(SITE).as_posix())
    if new != s:
        p.write_text(new, encoding='utf-8', newline='\n')
        changed += 1
        print('updated', p.resolve().relative_to(SITE))
print('changed', changed)
