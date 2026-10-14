"""Проверка конвертера в браузере (production или локальный сервер).

    python website/tools/check_converter_live.py [base_url]
"""
import sys

from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "https://dikenocracy.com").rstrip("/")
CASES = [  # gregorian -> expected Hebrew string fragment
    ((2023, 10, 7), "כ״ב תשרי תשפ״ד"),
    ((2024, 3, 25), "ט״ו אדר ב׳ תשפ״ד"),      # Shushan Purim, leap year
    ((2024, 2, 24), "ט״ו אדר א׳ תשפ״ד"),      # Purim Katan
    ((2025, 3, 14), "י״ד אדר תשפ״ה"),         # Purim, common year
    ((2026, 9, 12), "א׳ תשרי תשפ״ז"),          # Rosh Hashana 5787
    ((2026, 10, 14), "ג׳ חשון תשפ״ז"),         # Google answered 29 Tishrei: wrong (Hebcal, pyluach, ICU agree)
]
ok = True
with sync_playwright() as p:
    b = None
    for ch in ("msedge", "chrome", None):
        try:
            b = p.chromium.launch(channel=ch) if ch else p.chromium.launch()
            break
        except Exception:  # noqa: BLE001
            continue
    page = b.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE + "/converter/", wait_until="networkidle")
    for (y, m, d), want in CASES:
        page.fill("#g-year", str(y))
        page.fill("#g-month", str(m))
        page.fill("#g-day", str(d))
        page.click("#btn-g2d")
        page.wait_for_timeout(200)
        text = page.inner_text("#result-grid")
        good = want in text
        ok &= good
        print(("PASS" if good else "FAIL"), f"{y}-{m:02d}-{d:02d} -> {want}" + ("" if good else f" | got: {text!r}"))
    if errors:
        ok = False
        print("JS errors:", errors)
    b.close()
print("ALL PASSED" if ok else "SOME CHECKS FAILED")
sys.exit(0 if ok else 1)
