"""Checks that the protocol texts did not change: compares the article body of every generated
protocol page with the same page at a git revision (default HEAD).

    python website/tools/check_content.py [REV]
Compared per page: the visible text of the article body (everything after the document head),
the list of heading ids (anchors other sites link to), and the link targets inside the body.
Page chrome (navigation, rail, footer) is ignored on purpose. Exit code 1 on any difference.
"""
import re
import subprocess
import sys
import pathlib

from bs4 import BeautifulSoup

SITE = pathlib.Path(__file__).resolve().parent.parent
REV = sys.argv[1] if len(sys.argv) > 1 else 'HEAD'
REPO = SITE.parent


def body_parts(html):
    soup = BeautifulSoup(html, 'html.parser')
    art = soup.find('article', class_='protocol-article')
    if art is None:
        return None
    for sel in ('.doc-head', '.doc-crumbs', '.doc-head__title', '.protocol-kicker', '.protocol-meta', 'h1'):
        for el in art.select(sel):
            el.decompose()
    text = re.sub(r'\s+', ' ', art.get_text(' ')).strip()
    ids = [h.get('id') for h in art.find_all(re.compile(r'^h[2-6]$'))]
    links = [a.get('href') for a in art.find_all('a') if a.get('href') and not a.get('href').startswith('#cb')]
    return text, ids, links


bad = 0
pages = sorted((SITE / 'pages' / 'protocols').glob('*.html'))
for p in pages:
    rel = p.relative_to(REPO).as_posix()
    try:
        old = subprocess.run(['git', 'show', f'{REV}:{rel}'], cwd=REPO, capture_output=True, check=True).stdout.decode('utf-8')
    except subprocess.CalledProcessError:
        print('NEW  ', rel)
        continue
    a, b = body_parts(old), body_parts(p.read_text(encoding='utf-8'))
    if a != b:
        bad += 1
        what = [n for n, x, y in zip(('text', 'heading ids', 'links'), a, b) if x != y]
        print('DIFF ', rel, ', '.join(what))
print(f'{len(pages)} pages checked against {REV}: {"OK" if not bad else str(bad) + " differ"}')
sys.exit(1 if bad else 0)
