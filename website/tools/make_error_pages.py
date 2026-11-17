"""Generates the public error pages from 404.html (same chrome and design): website/errors/<code>.html and, for API
locations, website/errors/<code>.json in the API's error format. nginx maps status codes to these files
(server/nginx/site-errors.conf and api-errors.conf). No server or software details are disclosed.

    python website/tools/make_error_pages.py
"""
import json
import pathlib
import re

SITE = pathlib.Path(__file__).resolve().parent.parent
PAGES = {
    400: ("Bad request", "The request could not be understood.", "bad_request"),
    401: ("Authentication required", "This resource needs authentication.", "unauthorized"),
    403: ("Access denied", "You do not have access to this resource.", "forbidden"),
    404: ("Page not found", "This page does not exist within the Dikenocracy system.", "not_found"),
    405: ("Method not allowed", "This request method is not supported here.", "method_not_allowed"),
    410: ("Page removed", "This page or project is no longer available on dikenocracy.com.", "gone"),
    413: ("Request too large", "The request is larger than this service accepts.", "too_large"),
    429: ("Too many requests", "Please wait a moment and try again.", "rate_limited"),
    500: ("Server error", "Something went wrong on our side. Please try again later.", "internal_error"),
    502: ("Service unavailable", "A service behind this page is not responding. Please try again later.", "bad_gateway"),
    503: ("Service unavailable", "The service is temporarily unavailable. Please try again later.", "unavailable"),
    504: ("Service timeout", "The service took too long to respond. Please try again later.", "timeout"),
}
template = (SITE / "404.html").read_text(encoding="utf-8")
out = SITE / "errors"
out.mkdir(exist_ok=True)
for code, (title, text, api_code) in PAGES.items():
    page = template
    page = page.replace('<meta name="description" content="Page not found — Dikenocracy" />',
                        f'<meta name="description" content="{title} — Dikenocracy" />\n  <meta name="robots" content="noindex" />')
    page = page.replace("<title>404 — Dikenocracy</title>", f"<title>{code} — Dikenocracy</title>")
    page = re.sub(r'<h1 class="notfound__code">404</h1>', f'<h1 class="notfound__code">{code}</h1>', page)
    page = page.replace('<h2 class="notfound__title">Page not found</h2>', f'<h2 class="notfound__title">{title}</h2>')
    page = page.replace('<p class="notfound__text">This page does not exist within the Dikenocracy system.</p>',
                        f'<p class="notfound__text">{text}</p>')
    assert f"<title>{code} " in page and f">{code}</h1>" in page, code
    (out / f"{code}.html").write_text(page, encoding="utf-8", newline="\n")
    (out / f"{code}.json").write_text(json.dumps({"error": {"code": api_code, "message": title}}) + "\n", encoding="utf-8", newline="\n")
print("error pages:", ", ".join(map(str, PAGES)))
