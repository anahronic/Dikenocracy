#!/usr/bin/env python3
"""Inject Keeper into explicit files, or audit a site tree against ROUTES.json.

  python tools/keeper_inject.py SITE shadoo/index.html survival/index.html
  python tools/keeper_inject.py --check SITE
  python tools/keeper_inject.py --check --repo-only website

Full checks fail on missing live-only routes. --repo-only explicitly audits the
repository subset; it is not a substitute for checking a complete deployment tree.
The sandbox panel is an internal resource, not a host route; never inject it.
"""
import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path

TAG = '<script src="/keeper/keeper-loader.js" defer></script>'
DEFAULT_ROUTES = Path(__file__).resolve().parents[1] / 'website/keeper/ROUTES.json'


class Scripts(HTMLParser):
    def __init__(self):
        super().__init__()
        self.loaders = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag.lower() == 'script' and attrs.get('src') == '/keeper/keeper-loader.js':
            self.loaders.append(attrs)


def inspect(text):
    parser = Scripts()
    parser.feed(text)
    return parser.loaders


def target(root, route):
    path = (root / route.lstrip('/')).resolve()
    if not path.is_relative_to(root):
        raise ValueError('Route escapes site root: ' + route)
    if route.endswith('/'):
        path /= 'index.html'
    if path == root / 'keeper/panel.html':
        raise ValueError('The isolated panel must not contain the loader')
    return path


def inject(path):
    # Bytes in, bytes out: no newline translation, so every byte of the page except the inserted tag is kept.
    text = path.read_bytes().decode('utf-8')
    loaders = inspect(text)
    if len(loaders) > 1:
        raise ValueError(f'{path}: duplicate loader tags; repair before injection')
    if loaders:
        if 'defer' not in loaders[0]:
            raise ValueError(f'{path}: existing loader must have defer')
        return False
    matches = list(re.finditer(r'</body\s*>', text, re.I))
    if not matches:
        raise ValueError(f'{path}: no closing body tag')
    at = matches[-1].start()
    path.write_bytes((text[:at] + '  ' + TAG + '\n' + text[at:]).encode('utf-8'))
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', type=Path)
    parser.add_argument('files', nargs='*', help='HTML paths relative to root')
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--repo-only', action='store_true')
    parser.add_argument('--routes', type=Path, default=DEFAULT_ROUTES)
    args = parser.parse_args()
    root = args.root.resolve()
    if args.repo_only and not args.check:
        parser.error('--repo-only requires --check')
    errors, changed, checked, skipped = [], [], 0, []
    if args.check:
        routes = json.loads(args.routes.read_text(encoding='utf-8'))['routes']
        inventory = set()
        for route in routes:
            try:
                path = target(root, route['file'])
                inventory.add(path)
                if args.repo_only and route['source'] == 'live-only':
                    skipped.append(route['file'])
                    continue
                checked += 1
                if not path.is_file():
                    errors.append({'file': route['file'], 'error': 'missing', 'source': route['source']})
                    continue
                loaders = inspect(path.read_text(encoding='utf-8'))
                if len(loaders) != 1 or 'defer' not in loaders[0]:
                    errors.append({'file': route['file'], 'error': 'expected exactly one deferred loader', 'count': len(loaders)})
            except (ValueError, OSError) as error:
                errors.append({'file': route['file'], 'error': str(error)})
        for path in root.rglob('*.html'):
            if path.resolve() not in inventory and path.relative_to(root).as_posix() != 'keeper/panel.html':
                errors.append({'file': path.relative_to(root).as_posix(), 'error': 'not in route inventory'})
        panel = root / 'keeper/panel.html'
        if panel.exists() and inspect(panel.read_text(encoding='utf-8')):
            errors.append({'file': 'keeper/panel.html', 'error': 'recursive loader in panel'})
    else:
        if not args.files:
            parser.error('provide explicit HTML files to inject')
        for route in args.files:
            try:
                if inject(target(root, route)):
                    changed.append(route)
            except (ValueError, OSError) as error:
                errors.append({'file': route, 'error': str(error)})
    print(json.dumps({'ok': not errors, 'checked': checked, 'changed': changed, 'skipped_live_only': skipped, 'errors': errors}, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == '__main__':
    raise SystemExit(main())
