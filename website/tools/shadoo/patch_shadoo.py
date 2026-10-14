"""Applies the site's light design and the current Projects menu to the deployed Shadoo web build.

The web build on dikenocracy.com/shadoo/ is the site version of Shadoo (newest); its source is not in this
repository, so the change is a small, reviewable patch of the built files:

  * assets/site-light-<hash>.css (tools/shadoo/shadoo-light.css) is linked after the bundle CSS;
  * the Projects submenu in the bundle gets "Mazkira — Business Assistant", and the Shadoo item is marked current;
  * changed chunks get new file names, references between chunks, index.html and the Workbox precache list in
    sw.js are rewritten, and index.html's revision is recomputed — so returning visitors' service worker updates.

    python website/tools/shadoo/patch_shadoo.py <dir with the deployed shadoo/ files>   (patched in place)
"""
import hashlib
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
root = pathlib.Path(sys.argv[1])
assets = root / 'assets'


def short(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:8]


index = (root / 'index.html').read_text(encoding='utf-8')
sw = (root / 'sw.js').read_text(encoding='utf-8')
main_name = re.search(r'/shadoo/assets/(index-[\w-]+\.js)', index).group(1)
main = (assets / main_name).read_text(encoding='utf-8')

if 'href:`/mazkira/`' in main:
    sys.exit('already patched')

# 1) menu: Mazkira after Survival Manual; Shadoo marked as the current page
survival = '(0,O.jsx)(`li`,{children:(0,O.jsx)(`a`,{href:`/survival/`,children:`Survival Manual`})})'
assert main.count(survival) == 1, 'menu markup not found'
mazkira = '(0,O.jsx)(`li`,{children:(0,O.jsx)(`a`,{href:`/mazkira/`,children:`Mazkira — Business Assistant`})})'
main = main.replace(survival, survival + ',' + mazkira)
shadoo_item = '(0,O.jsx)(`a`,{href:`/shadoo/`,children:`Shadoo`})'
assert main.count(shadoo_item) == 1
main = main.replace(shadoo_item, '(0,O.jsx)(`a`,{href:`/shadoo/`,"aria-current":`page`,children:`Shadoo`})')

# 2) new names for the main chunk and the chunks that import it (they reference each other by name)
web_names = sorted({m for m in re.findall(r'web-[\w-]{8}\.js', main)})
chunks = {main_name: main}
for w in web_names:
    chunks[w] = (assets / w).read_text(encoding='utf-8')
rename = {old: re.sub(r'-[\w-]{8}\.js$', f'-{short((old + "|light-20261014").encode())}.js', old) for old in chunks}
for old in list(chunks):
    text = chunks[old]
    for a, b in rename.items():
        text = text.replace(a, b)
    chunks[old] = text
for old, text in chunks.items():
    (assets / rename[old]).write_text(text, encoding='utf-8', newline='\n')
    (assets / old).unlink()

# 3) light stylesheet
css = (HERE / 'shadoo-light.css').read_bytes()
css_name = f'site-light-{short(css)}.css'
(assets / css_name).write_bytes(css)
bundle_css = re.search(r'/shadoo/assets/(index-[\w-]+\.css)', index).group(1)

# 4) index.html
for a, b in rename.items():
    index = index.replace(a, b)
index = index.replace(f'<link rel="stylesheet" crossorigin href="/shadoo/assets/{bundle_css}">',
                      f'<link rel="stylesheet" crossorigin href="/shadoo/assets/{bundle_css}">\n'
                      f'    <link rel="stylesheet" href="/shadoo/assets/{css_name}">', 1)
assert css_name in index
index = re.sub(r'(<meta name="theme-color" content=")[^"]*(")', r'\1#faf8f4\2', index)
(root / 'index.html').write_text(index, encoding='utf-8', newline='\n')

# 5) Workbox precache list
for a, b in rename.items():
    sw = sw.replace(f'"assets/{a}"', f'"assets/{b}"')
rev = hashlib.md5((root / 'index.html').read_bytes()).hexdigest()
sw, n = re.subn(r'(\{url:"index\.html",revision:")[0-9a-f]{32}(")', rf'\g<1>{rev}\2', sw)
assert n == 1, 'index.html entry not found in sw.js'
sw = sw.replace(f'{{url:"assets/{bundle_css}",revision:null}}',
                f'{{url:"assets/{bundle_css}",revision:null}},{{url:"assets/{css_name}",revision:null}}', 1)
assert css_name in sw
(root / 'sw.js').write_text(sw, encoding='utf-8', newline='\n')
print('renamed:', rename)
print('stylesheet:', css_name)
