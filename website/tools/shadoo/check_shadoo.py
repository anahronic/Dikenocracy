"""Browser check of Shadoo: menu, light skin, encrypt→decrypt round trip, CSP errors, service-worker update.

    python website/tools/shadoo/check_shadoo.py <base_url> [--swap-cmd "<command that swaps old→new files>"]
With --swap-cmd: loads the page (old build registers its service worker), runs the command, reloads twice and
checks that the new build is served — i.e. returning visitors get the update.
"""
import subprocess
import sys

from playwright.sync_api import sync_playwright

BASE = sys.argv[1].rstrip('/')
SWAP = sys.argv[sys.argv.index('--swap-cmd') + 1] if '--swap-cmd' in sys.argv else None
ok = True


def check(cond, msg):
    global ok
    print(('PASS ' if cond else 'FAIL ') + msg)
    ok = ok and bool(cond)


with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge')
    ctx = b.new_context(viewport={'width': 1366, 'height': 900}, locale='en-US')
    page = ctx.new_page()
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE + '/shadoo/', wait_until='networkidle')
    if SWAP:
        page.wait_for_function('navigator.serviceWorker && navigator.serviceWorker.controller !== null', timeout=15000)
        check(page.locator(".site-nav__submenu a[href='/ayalon/']").count() == 1, 'old build served first (still lists Ayalon)')
        subprocess.run(SWAP, shell=True, check=True)
        page.reload(wait_until='networkidle')
        page.wait_for_timeout(2500)
        page.reload(wait_until='networkidle')
        page.wait_for_timeout(1000)
    for href in ('/mazkira/', '/ayalon/'):   # withdrawn from the public site 2026-11-17
        check(page.locator(f".site-nav__submenu a[href='{href}']").count() == 0, f'menu has no {href}')
    for name in ('Converter', 'Shadoo', 'Survival Manual'):
        check(page.locator('.site-nav__submenu a', has_text=name).count() == 1, f'menu still has {name}')
    bg = page.evaluate("getComputedStyle(document.querySelector('.app')).backgroundColor")
    check(bg in ('rgb(255, 255, 255)',), f'light app card ({bg})')
    nav_bg = page.evaluate("getComputedStyle(document.querySelector('.site-nav')).backgroundColor")
    check('255, 255, 255' in nav_bg, f'light navigation ({nav_bg})')
    # encrypt → decrypt round trip through the wizard
    secret, phrase = 'hello from the round-trip test', 'correct horse battery staple 42'
    main = page.locator('.app-main')
    main.get_by_role('button', name='Encrypt').first.click()
    main.locator('textarea').fill(secret)
    main.get_by_role('button', name='Next').click()
    main.locator('input[type=password]').fill(phrase)
    main.get_by_role('button', name='Next').click()
    main.get_by_role('button', name='No expiration').click()
    main.get_by_role('button', name='Encrypt').click()
    page.wait_for_timeout(1500)
    import re as _re
    m = _re.search(r'SM2\.[A-Za-z0-9_\-=.]+', main.inner_text())
    token = m.group(0) if m else ''
    check(len(token) > 40, f'cipher text produced ({len(token)} chars)')
    main.get_by_role('button', name='Done').click()
    main.get_by_role('button', name='Decrypt').first.click()
    main.locator('textarea').fill(token)
    main.get_by_role('button', name='Next').click()
    main.locator('input[type=password]').fill(phrase)
    enabled = [x for x in main.locator('button').all() if x.is_enabled() and x.inner_text().strip() not in ('←', '')]
    enabled[-1].click()
    page.wait_for_timeout(1500)
    check(secret in main.inner_text(), 'decrypted text equals the original')
    page.screenshot(path='shadoo-check.png', full_page=True)
    bad = [e for e in errors if ('Content Security Policy' in e or 'Refused' in e or 'TypeError' in e)
           and 'cloudflareinsights' not in e]   # Cloudflare's injected beacon is blocked by Shadoo's CSP on purpose
    check(not bad, f'no CSP/JS errors {bad[:3]}')
    b.close()
print('ALL PASSED' if ok else 'SOME CHECKS FAILED')
sys.exit(0 if ok else 1)
