"""Builds the deployed stylesheet from its sources.

    python website/tools/build_site_css.py
fonts.generated.css (self-hosted @font-face rules) + site.css -> website/styles-20261118.css.
When the stylesheet changes after a deploy, give it a new date in OUT_NAME, CSS_MAIN in
build_release.py and tools/apply_chrome.py, so returning visitors and Cloudflare get the new file.
"""
import pathlib

TOOLS = pathlib.Path(__file__).resolve().parent
OUT_NAME = 'styles-20261118.css'
fonts = (TOOLS / 'fonts.generated.css').read_text(encoding='utf-8')
site = (TOOLS / 'site.css').read_text(encoding='utf-8')
out = TOOLS.parent / OUT_NAME
out.write_text(site.replace('*/\n', '*/\n\n' + fonts + '\n', 1), encoding='utf-8', newline='\n')
print('wrote', out, out.stat().st_size, 'bytes')
