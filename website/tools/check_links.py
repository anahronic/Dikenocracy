"""Checks every local href/src of the site pages against a running server.

    python website/tools/check_links.py http://127.0.0.1:8765 [extra_dir_with_pages]
External apps (/ayalon/, /shadoo/, /mazkira/, /AA/, /survival/ when not staged) are only checked for existence of the link.
"""
import pathlib
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = sys.argv[1].rstrip('/')
SITE = pathlib.Path(__file__).resolve().parent.parent
SKIP = ('/ayalon/', '/shadoo/', '/mazkira/', '/AA/', '/survival/')
pages = [p for p in SITE.rglob('*.html') if 'tools' not in p.parts]
seen, bad = set(), []
for page in pages:
    rel = '/' + page.relative_to(SITE).as_posix()
    html = page.read_text(encoding='utf-8')
    for m in re.finditer(r'(?:href|src)="([^"#][^"]*)"', html):
        url = m.group(1)
        if url.startswith(('http:', 'https:', 'mailto:', 'data:')):
            continue
        full = urllib.parse.urljoin(rel, url.split('#')[0])
        if full.startswith(SKIP) or full in seen:
            continue
        seen.add(full)
        try:
            urllib.request.urlopen(BASE + urllib.parse.quote(full, safe='/%?=&.-_'), timeout=10)
        except urllib.error.HTTPError as e:
            bad.append((rel, url, e.code))
    for m in re.finditer(r'<use href="([^"]+)"', html):
        sym = m.group(1)
        f, _, frag = sym.partition('#')
        svg = (SITE / f.lstrip('/')).read_text(encoding='utf-8')
        if f'id="{frag}"' not in svg:
            bad.append((rel, sym, 'missing symbol'))
print(f'pages={len(pages)} unique local links={len(seen)}')
for b in bad:
    print('BROKEN', *b)
sys.exit(1 if bad else 0)
