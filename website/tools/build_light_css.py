"""Builds styles-20261013.css (light theme) from the layout rules of styles-20260923.css
plus tools/redesign_light.css.

    python website/tools/build_light_css.py
The old stylesheet stays on the server for pages that still reference it.
"""
import pathlib
import re

SITE = pathlib.Path(__file__).resolve().parent.parent
old = (SITE / 'tools' / 'source' / 'styles-20260923.css').read_text(encoding='utf-8').replace('\r\n', '\n')

HEADER = '''/*
 * Dikenocracy — Public Website, light theme (2026-10-13)
 *
 * Design principles:
 *   - Light, warm paper background; white cards; one indigo action colour, gold accents
 *   - Pictures carry the message: illustration, layer icons, project covers, diagrams
 *   - Clean hierarchy, strong readability, mobile-first
 * Layout rules come from styles-20260923.css; components are in tools/redesign_light.css.
 */
'''

ROOT = ''':root {
  /* Color palette (light) */
  --bg-deep:       #faf8f4;
  --bg-panel:      #f3efe7;
  --bg-card:       #ffffff;
  --border:        #e6e0d5;
  --border-strong: #d6cfc2;
  --accent:        #8a6514;
  --accent-alt:    #c99a2e;
  --accent-dim:    rgba(138, 101, 20, 0.28);
  --gold-soft:     #f7edd3;
  --primary:       #3d3489;
  --primary-hover: #2f2870;
  --primary-soft:  #ece8fb;
  --link:          #3d3489;
  --link-hover:    #2f2870;
  --text-primary:  #1f2733;
  --text-secondary:#4d5666;
  --text-muted:    #6b7382;
  --muted:         #6b7382;
  --white:         #141a28;   /* historic name: the strongest text colour (headings) */
  --shadow-sm:     0 1px 2px rgba(31, 39, 51, 0.05), 0 4px 14px rgba(31, 39, 51, 0.05);
  --shadow-lg:     0 2px 4px rgba(31, 39, 51, 0.06), 0 18px 40px rgba(31, 39, 51, 0.12);

  /* Typography */
  --font-main:  Georgia, 'Times New Roman', serif;
  --font-ui:    'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono:  Consolas, 'Courier New', Courier, monospace;

  /* Spacing rhythm */
  --gap-xs:  0.5rem;
  --gap-sm:  1rem;
  --gap-md:  2rem;
  --gap-lg:  4rem;
  --gap-xl:  6rem;

  /* Transitions */
  --fade:  opacity 0.3s ease, visibility 0.3s ease;
}'''

css = old
css = css[css.index('/* ─── Reset & Base'):]
css = re.sub(r':root \{.*?\n\}', ROOT, css, count=1, flags=re.S)
# splash screens of the old index page are not used any more
a = css.index('/* ─── Intro / Welcome Screens')
b = css.index('/* ─── Page Layout')
css = css[:a] + css[b:]
a = css.index('/* ─── Index page (splash)')
b = css.index('/* ─── Long-document reader')
css = css[:a] + css[b:]
# old dark navigation block (rewritten in redesign_light.css)
css = css[:css.index('/* Shared Dikenocracy navigation.')].rstrip() + '\n'
for dark, light in [
    ('rgba(59, 130, 246, 0.06)', 'var(--primary-soft)'),
    ('rgba(212, 175, 55, 0.05)', 'var(--gold-soft)'),
    ('rgba(255, 255, 255, 0.02)', '#fbfaf7'),
    ('rgba(17, 17, 23, 0.85)', 'rgba(255, 255, 255, 0.92)'),
    ('rgba(17, 17, 23, 0.95)', '#ffffff'),
    ('rgba(240, 169, 64, 0.06)', 'var(--gold-soft)'),
    ('rgba(255, 255, 255, 0.025)', '#fbfaf7'),
]:
    assert dark in css, dark
    css = css.replace(dark, light)
assert '#0B0B0B' not in css and '#121212' not in css, 'dark colours left'

out = HEADER + '\n' + css + '\n' + (SITE / 'tools' / 'redesign_light.css').read_text(encoding='utf-8')
(SITE / 'styles-20261013.css').write_text(out, encoding='utf-8', newline='\n')
# protocol-specific rules only use variables; copy under the new name for cache busting
(SITE / 'protocols-20261013.css').write_text(
    (SITE / 'tools' / 'source' / 'protocols-20261004.css').read_text(encoding='utf-8').replace('\r\n', '\n')
    .replace('Loaded after styles-20260923.css', 'Loaded after styles-20261013.css'), encoding='utf-8', newline='\n')
print('styles-20261013.css', len(out), 'bytes')
