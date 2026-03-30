#!/usr/bin/env python3
"""
add_i18n_attrs.py — Batch-add data-i18n attributes and i18n.js script tag
to all protocol HTML pages.

This script:
1. Adds data-i18n attributes to translatable UI elements
2. Adds data-i18n-layer attributes to protocol map layer labels
3. Adds the i18n.js script tag before the closing </body>
4. Does NOT modify protocol article content (that's handled by the loader)
"""

import re
import os
import glob

PROTO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pages', 'protocols')

# Layer label mapping: text → data-i18n-layer key
LAYER_MAP = {
    'Foundation':       'layer_foundation',
    'L0 — Physical Truth': 'layer_l0',
    'L0 \u2014 Physical Truth': 'layer_l0',
    'L1 — Core':        'layer_l1',
    'L1 \u2014 Core':   'layer_l1',
    'L2 — Economic':    'layer_l2',
    'L2 \u2014 Economic': 'layer_l2',
    'L3 — Security':    'layer_l3',
    'L3 \u2014 Security': 'layer_l3',
    'L4 — Stability':   'layer_l4',
    'L4 \u2014 Stability': 'layer_l4',
    'L5 — Human Infra': 'layer_l5',
    'L5 \u2014 Human Infra': 'layer_l5',
    'L6 — Intersystem': 'layer_l6',
    'L6 \u2014 Intersystem': 'layer_l6',
    'L7 — Meta / Scope': 'layer_l7',
    'L7 \u2014 Meta / Scope': 'layer_l7',
    'L8 — Infrastructure': 'layer_l8',
    'L8 \u2014 Infrastructure': 'layer_l8',
    'Appendix':         'layer_appendix',
}


def add_i18n_to_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    modified = False

    # 1. Skip link
    old = '<a href="#main" class="skip-link">Skip to content</a>'
    new = '<a href="#main" class="skip-link" data-i18n="skip_to_content">Skip to content</a>'
    if old in html and new not in html:
        html = html.replace(old, new)
        modified = True

    # 2. Toggle navigation button aria-label
    old_toggle = 'class="site-nav__toggle" aria-label="Toggle navigation"'
    new_toggle = 'class="site-nav__toggle" aria-label="Toggle navigation" data-i18n-aria="toggle_navigation"'
    if old_toggle in html and 'data-i18n-aria="toggle_navigation"' not in html:
        html = html.replace(old_toggle, new_toggle)
        modified = True

    # 3. Nav links: About, Protocols, Projects, Converter
    nav_items = {
        '>About</a>':      ' data-i18n="about">About</a>',
        ' aria-current="page">Protocols</a>': ' aria-current="page" data-i18n="protocols">Protocols</a>',
        '>Projects</a>':   ' data-i18n="projects">Projects</a>',
        '>Converter</a>':  ' data-i18n="converter">Converter</a>',
    }
    for old_frag, new_frag in nav_items.items():
        if old_frag in html and 'data-i18n=' not in html.split(old_frag)[0].split('<a')[-1] + old_frag:
            # Only replace in nav context
            html = html.replace(old_frag, new_frag, 1)
            modified = True

    # 4. Protocol Map heading
    old_pm = '<div class="protocol-map__heading">Protocol Map</div>'
    new_pm = '<div class="protocol-map__heading" data-i18n="protocol_map">Protocol Map</div>'
    if old_pm in html and new_pm not in html:
        html = html.replace(old_pm, new_pm)
        modified = True

    # 5. TOC headings: "On This Page" (button span + heading div)
    old_otp_btn = '<span>On This Page</span>'
    new_otp_btn = '<span data-i18n="on_this_page">On This Page</span>'
    if old_otp_btn in html and new_otp_btn not in html:
        html = html.replace(old_otp_btn, new_otp_btn)
        modified = True

    old_otp_div = '<div class="protocol-toc__heading">On This Page</div>'
    new_otp_div = '<div class="protocol-toc__heading" data-i18n="on_this_page">On This Page</div>'
    if old_otp_div in html and new_otp_div not in html:
        html = html.replace(old_otp_div, new_otp_div)
        modified = True

    # 6. Toolbar: ← All Protocols
    old_back = '>&larr; All Protocols</a>'
    new_back = ' data-i18n-html="back_to_protocols">&larr; All Protocols</a>'
    if old_back in html and 'data-i18n-html="back_to_protocols"' not in html:
        html = html.replace(old_back, new_back)
        modified = True

    # 7. Bottom nav: Previous/Next Protocol
    # Previous
    old_prev = '>&larr; Previous Protocol</a>'
    new_prev = ' data-i18n-html="previous_protocol">&larr; Previous Protocol</a>'
    if old_prev in html and 'data-i18n-html="previous_protocol"' not in html:
        html = html.replace(old_prev, new_prev)
        modified = True

    # Next
    old_next = '>Next Protocol &rarr;</a>'
    new_next = ' data-i18n-html="next_protocol">Next Protocol &rarr;</a>'
    if old_next in html and 'data-i18n-html="next_protocol"' not in html:
        html = html.replace(old_next, new_next)
        modified = True

    # 8. Footer text
    old_footer = '<p>Dikenocracy &mdash; public framework. Built openly alongside the old world.</p>'
    new_footer = '<p data-i18n-html="footer_text">Dikenocracy &mdash; public framework. Built openly alongside the old world.</p>'
    if old_footer in html and new_footer not in html:
        html = html.replace(old_footer, new_footer)
        modified = True

    # 9. Protocol map layer labels
    for layer_text, attr_key in LAYER_MAP.items():
        # Match both with and without --active class
        pattern = r'(<span class="protocol-map__layer-label(?:[^"]*)")>' + re.escape(layer_text) + r'</span>'
        replacement = r'\1 data-i18n-layer="' + attr_key + '">' + layer_text + '</span>'
        if 'data-i18n-layer="' + attr_key + '"' not in html:
            new_html = re.sub(pattern, replacement, html)
            if new_html != html:
                html = new_html
                modified = True

    # 10. Add i18n.js script tag before </body> if not already present
    if 'i18n.js' not in html:
        html = html.replace(
            '<script src="../../script.js"></script>',
            '<script src="../../script.js"></script>\n  <script src="../../i18n.js"></script>'
        )
        modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        return True
    return False


def main():
    files = sorted(glob.glob(os.path.join(PROTO_DIR, '*.html')))
    print(f'Found {len(files)} protocol HTML files')

    updated = 0
    for filepath in files:
        fname = os.path.basename(filepath)
        if add_i18n_to_file(filepath):
            print(f'  ✓ Updated: {fname}')
            updated += 1
        else:
            print(f'  · Skipped (already up to date): {fname}')

    print(f'\nDone. Updated {updated}/{len(files)} files.')


if __name__ == '__main__':
    main()
