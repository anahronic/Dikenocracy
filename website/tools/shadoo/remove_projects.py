"""Removes the Mazkira and Ayalon items from the Projects submenu of the deployed Shadoo web build.

Mazkira and Ayalon were withdrawn from the public site on 2026-11-17
(PUBLIC_REMOVAL_VERIFICATION_2026-11-17.md in the Dikenocracy workspace). The Shadoo source is not in this
repository, so, like patch_shadoo.py, this is a small, reviewable patch of the built files:

  * the two <li> items are removed from the menu in the main chunk;
  * the main chunk and the chunks that import it get new file names (they reference each other by name),
    index.html and the Workbox precache list in sw.js are rewritten, and index.html's revision is
    recomputed, so returning visitors' service worker picks up the new build.

    python website/tools/shadoo/remove_projects.py <dir with the deployed shadoo/ files>   (patched in place)

Idempotent: a build without those items is left unchanged.
"""
import hashlib
import pathlib
import re
import sys

ITEMS = ('(0,O.jsx)(`li`,{children:(0,O.jsx)(`a`,{href:`/mazkira/`,children:`Mazkira — Business Assistant`})})',
         '(0,O.jsx)(`li`,{children:(0,O.jsx)(`a`,{href:`/ayalon/`,children:`Ayalon Monitor`})})')
SALT = '|drop-mazkira-ayalon-20261117'

root = pathlib.Path(sys.argv[1])
assets = root / 'assets'


def short(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:8]


def read(p: pathlib.Path) -> str:
    return p.read_bytes().decode('utf-8')


def write(p: pathlib.Path, text: str) -> None:
    p.write_bytes(text.encode('utf-8'))


index = read(root / 'index.html')
sw = read(root / 'sw.js')
main_name = re.search(r'/shadoo/assets/(index-[\w-]+\.js)', index).group(1)
main = read(assets / main_name)

present = [i for i in ITEMS if i in main]
if not present:
    print('menu already without Mazkira and Ayalon')
    sys.exit(0)

# 1) menu items (each is one element of the submenu's children array)
for item in present:
    assert main.count(item) == 1, f'menu item found more than once: {item[:60]}'
    if ',' + item in main:
        main = main.replace(',' + item, '', 1)
    else:
        main = main.replace(item + ',', '', 1)
low = main.lower()
assert 'href:`/mazkira/`' not in low and 'href:`/ayalon/`' not in low, 'menu links left in the bundle'

# 2) new names for the main chunk and every chunk that imports it
chunks = {main_name: main}
for p in sorted(assets.glob('*.js')):
    if p.name != main_name and main_name in read(p):
        chunks[p.name] = read(p)
rename = {old: re.sub(r'-[\w-]{8}\.js$', f'-{short((old + SALT).encode())}.js', old) for old in chunks}
assert len(set(rename.values())) == len(rename) and not any((assets / n).exists() for n in rename.values())
for old in list(chunks):
    text = chunks[old]
    for a, b in rename.items():
        text = text.replace(a, b)
    chunks[old] = text
for old, text in chunks.items():
    write(assets / rename[old], text)
    (assets / old).unlink()

# 3) index.html and the Workbox precache list
for a, b in rename.items():
    index = index.replace(a, b)
    sw = sw.replace(f'"assets/{a}"', f'"assets/{b}"')
write(root / 'index.html', index)
rev = hashlib.md5((root / 'index.html').read_bytes()).hexdigest()
sw, n = re.subn(r'(\{url:"index\.html",revision:")[0-9a-f]{32}(")', rf'\g<1>{rev}\2', sw)
assert n == 1, 'index.html entry not found in sw.js'
assert all(f'"assets/{b}"' in sw for b in rename.values()), 'renamed chunk missing from the precache list'
write(root / 'sw.js', sw)
print('removed:', len(present), 'menu items')
print('renamed:', rename)
