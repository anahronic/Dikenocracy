"""Lists files of the web root that no page, script or stylesheet references (run on the server).

    python3 find_unreferenced.py /var/www/html
Self-contained apps (AA/, shadoo/, survival/ downloads) are scanned for references but their internals are not listed.
"""
import pathlib
import re
import sys
import urllib.parse

root = pathlib.Path(sys.argv[1])
SKIP_LIST = ('AA/', 'shadoo/', 'shadoo.old/')
text_ext = {'.html', '.js', '.css', '.webmanifest', '.xml', '.txt', '.json', '.svg'}
refs = set()
for p in root.rglob('*'):
    if not p.is_file() or p.suffix.lower() not in text_ext:
        continue
    rel_dir = '/' + p.parent.relative_to(root).as_posix()
    try:
        t = p.read_text(encoding='utf-8', errors='replace')
    except OSError:
        continue
    for m in re.finditer(r'(?:href|src|content|url)\s*[=(]\s*["\']?([^"\'\s)>]+)', t):
        u = urllib.parse.unquote(m.group(1).split('#')[0].split('?')[0])
        if not u or u.startswith(('http:', 'https:', 'data:', 'mailto:', 'javascript:')):
            if u.startswith('https://dikenocracy.com/'):
                u = u[len('https://dikenocracy.com'):]
            else:
                continue
        full = urllib.parse.urljoin(rel_dir.rstrip('/') + '/', u)
        refs.add(full.lstrip('/'))
    for m in re.finditer(r'["\'`](/?[\w./-]+\.(?:css|js|png|jpg|jpeg|webp|svg|ico|txt|md|pdf|html))["\'`]', t):
        refs.add(urllib.parse.urljoin(rel_dir.rstrip('/') + '/', m.group(1)).lstrip('/'))
ENTRY = {'index.html', '404.html', 'robots.txt', 'sitemap.xml'}
unref = []
for p in sorted(root.rglob('*')):
    if not p.is_file():
        continue
    rel = p.relative_to(root).as_posix()
    if rel.startswith(SKIP_LIST) or rel in ENTRY:
        continue
    if rel not in refs and not (rel.endswith('index.html') and rel[:-len('index.html')] in refs):
        unref.append((p.stat().st_size, rel))
for size, rel in unref:
    print(f'{size:>10}  {rel}')
print('unreferenced:', len(unref))
