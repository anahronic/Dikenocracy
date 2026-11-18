"""Data-driven protocol counts (2026-11-18).

    python website/tools/catalog_counts.py          check (exit 1 on any mismatch)
    python website/tools/catalog_counts.py --write  rewrite the marked counts of the hand-written pages

Source of truth: pages/protocols/catalog.json, written by build_release.py from the canonical sources (World). The
number of protocols is the number of distinct DKP identifiers of kind "protocol"; the Code, the CRISIS addendum and
Appendix A are documents, not protocols. Hand-written pages mark every active count with data-count="protocols" or
data-count="layer:L<n>" (the element's text is the count, optionally followed by " protocol(s)").
Checks: marked counts = catalog; the generated archive states the same total and per-layer counts in both views;
rendered protocol entries = distinct canonical DKP IDs (no duplicates, none missing) in each view; every archive and
home-page link to a protocol page has a destination file; catalog = manifest.txt.
Historical documents (release notes, SITE_AUDIT.md, the canonical glossary heading) are not active counts and are not
rewritten.
"""
import json
import pathlib
import re
import sys

SITE = pathlib.Path(__file__).resolve().parent.parent
CATALOG = SITE / 'pages' / 'protocols' / 'catalog.json'
MARKED = ['index.html']
MARK = re.compile(r'(<(\w+)[^>]*\bdata-count="([a-z0-9:]+)"[^>]*>)([^<]*)(</\2>)')


def expected(cat, key):
    n = cat['counts']['protocols'] if key == 'protocols' else cat['counts']['layers'][key.split(':', 1)[1]]
    return n


def render(text, n):
    m = re.fullmatch(r'\s*\d+(\s+protocols?)?\s*', text)
    if not m:
        return None
    suffix = (' protocol' + ('s' if n != 1 else '')) if m.group(1) else ''
    return f'{n}{suffix}'


def run(write=False):
    errors = []
    cat = json.loads(CATALOG.read_text(encoding='utf-8'))
    docs = cat['documents']
    manifest = [l.split('\t')[0] for l in (SITE / 'pages/protocols/manifest.txt').read_text(encoding='utf-8').splitlines() if l]
    if [d['slug'] for d in docs] != manifest:
        errors.append('catalog.json and manifest.txt list different documents')
    ids = [d['id'] for d in docs if d['kind'] == 'protocol']
    if len(ids) != len(set(ids)) or len(set(ids)) != cat['counts']['protocols']:
        errors.append(f'protocol identities: {len(ids)} entries, {len(set(ids))} distinct, catalog says {cat["counts"]["protocols"]}')
    for d in docs:
        if not (SITE / d['href'].lstrip('/')).is_file():
            errors.append(f'missing page for {d["slug"]}')

    for name in MARKED:
        path = SITE / name
        text = path.read_text(encoding='utf-8')
        found = 0

        def fix(m):
            nonlocal found
            found += 1
            n = expected(cat, m.group(3))
            new = render(m.group(4), n)
            if new is None:
                errors.append(f'{name}: data-count="{m.group(3)}" has unexpected text {m.group(4)!r}')
                return m.group(0)
            if new != m.group(4):
                if not write:
                    errors.append(f'{name}: data-count="{m.group(3)}" says {m.group(4)!r}, catalog gives {new!r}')
                return m.group(1) + new + m.group(5)
            return m.group(0)
        new_text = MARK.sub(fix, text)
        if write and new_text != text:
            path.write_text(new_text, encoding='utf-8', newline='\n')
        if not found:
            errors.append(f'{name}: no data-count markers')
        for m in re.finditer(r'href="/pages/protocols(?:/([a-z0-9-]+))?\.html(#[a-z0-9-]+)?"', text):
            if m.group(1) and not (SITE / 'pages' / 'protocols' / f'{m.group(1)}.html').is_file():
                errors.append(f'{name}: dead link to {m.group(1)}')

    index = (SITE / 'pages' / 'protocols.html').read_text(encoding='utf-8')
    n = cat['counts']['protocols']
    for phrase in (f'{n} protocols across 9 layers', f'all {n} protocols', f'{cat["counts"]["documents"]} documents'):
        if phrase not in index:
            errors.append(f'protocols.html does not state "{phrase}"')
    if re.findall(r'\b(\d+) protocols across', index) != [str(n)] * len(re.findall(r'\b(\d+) protocols across', index)):
        errors.append('protocols.html states a different total somewhere')
    current = index.split('data-archive-view="classic"')[0]
    classic = index.split('data-archive-view="classic"', 1)[1] if 'data-archive-view="classic"' in index else ''
    for view, part, pattern in (('current', current, r'class="proto-row"[^>]*><a href="protocols/([a-z0-9-]+)\.html"'),
                                ('classic', classic, r'class="c-protocol-layer" href="protocols/([a-z0-9-]+)\.html"')):
        rendered = re.findall(pattern, part)
        if sorted(rendered) != sorted(manifest):
            errors.append(f'{view} view lists {len(rendered)} entries, catalog has {len(manifest)}')
        proto = [s for s in rendered if any(d['slug'] == s and d['kind'] == 'protocol' for d in docs)]
        if len(proto) != len(set(proto)) or len(set(proto)) != n:
            errors.append(f'{view} view: {len(set(proto))} distinct protocol entries, expected {n}')
    for key, count in cat['counts']['layers'].items():
        label = f'{count} protocol{"s" if count != 1 else ""}'
        cur = re.search(rf'data-layer="{key}"[^>]*>.*?</section>', current, re.S)
        cla = re.search(rf'data-layer="{key}"[^>]*>.*?</section>', classic, re.S)
        if not cur or label not in cur.group(0):
            errors.append(f'current view: layer {key} does not state "{label}"')
        if not cla or label not in cla.group(0):
            errors.append(f'classic view: layer {key} does not state "{label}"')
    return errors


if __name__ == '__main__':
    errs = run('--write' in sys.argv)
    for e in errs:
        print('FAIL', e)
    print('catalog counts:', 'ok' if not errs else f'{len(errs)} problem(s)')
    sys.exit(1 if errs else 0)
