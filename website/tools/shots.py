"""Скриншоты страниц сайта (desktop + mobile) для визуальной проверки дизайна.

    python website/tools/shots.py <base_url> <out_dir> [page ...]
"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = sys.argv[1].rstrip("/")
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
PAGES = sys.argv[3:] or ["/", "/pages/about.html", "/pages/protocols.html", "/pages/projects.html",
                         "/pages/protocols/dkp-1-axioms-001.html", "/pages/converter.html", "/converter/",
                         "/404.html"]
with sync_playwright() as p:
    b = None
    for ch in ("msedge", "chrome", None):
        try:
            b = p.chromium.launch(channel=ch) if ch else p.chromium.launch()
            break
        except Exception:  # noqa: BLE001
            continue
    for label, vp, mobile in (("desk", {"width": 1366, "height": 860}, False), ("mob", {"width": 390, "height": 844}, True)):
        ctx = b.new_context(viewport=vp, is_mobile=mobile, has_touch=mobile, reduced_motion="reduce")
        pg = ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e, errs=errs: errs.append(str(e)))
        pg.on("console", lambda m, errs=errs: errs.append(m.text) if m.type == "error" else None)
        for path in PAGES:
            pg.goto(BASE + path, wait_until="networkidle")
            pg.wait_for_timeout(600)
            name = (path.strip("/").replace("/", "_").replace(".html", "") or "index")
            pg.screenshot(path=str(OUT / f"{label}-{name}.png"), full_page=True)
        if errs:
            print(label, "errors:", errs[:5])
        ctx.close()
    b.close()
print("saved to", OUT)
