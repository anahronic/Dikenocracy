"""Applies the shared page chrome (nav logo, footer, light stylesheet, OG image) to hand-written pages.

    python website/tools/apply_chrome.py [file_or_dir ...]
Without arguments: every *.html of website/ except the generated protocol pages (build_release.py makes those).
Idempotent: running it twice changes nothing.
"""
import pathlib
import re
import sys

SITE = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SITE))
from build_release import BRAND_HTML, CSS_MAIN, CSS_PROTOCOLS, FOOTER_HTML, OG_IMAGE  # noqa: E402

FOOTER_RE = re.compile(r'<footer class="site-footer">.*?</footer>', re.S)


def apply(html: str) -> str:
    html = html.replace('<a class="site-nav__brand" href="/">Dikenocracy</a>', BRAND_HTML)
    html = html.replace('/styles-20260923.css', CSS_MAIN).replace('/protocols-20261004.css', CSS_PROTOCOLS)
    html = re.sub(r'https://dikenocracy\.com/assets/main_screen\.webp', 'https://dikenocracy.com' + OG_IMAGE, html)
    html = FOOTER_RE.sub(lambda m: m.group(0) if 'site-footer__inner' in m.group(0) else FOOTER_HTML, html, count=1)
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
    new = apply(s)
    if new != s:
        p.write_text(new, encoding='utf-8', newline='\n')
        changed += 1
        print('updated', p)
print('changed', changed)
