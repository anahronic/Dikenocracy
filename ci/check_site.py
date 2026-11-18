"""Site consistency checks for CI (2026-11-17). Exit 1 on any failure.

- protocol registry: build_release.py REGISTRY == pages/protocols/manifest.txt == page files == sitemap protocol URLs
  == links on the protocol index; the index states the number of canonical protocols (35 + supporting documents)
- counts are data-driven from pages/protocols/catalog.json (tools/catalog_counts.py); classic-view CSS reproducible
- removed projects (Mazkira, Ayalon) appear on no published page, script or stylesheet
- no custom translation UI (language switchers, data-i18n, i18n loaders) and nothing blocks browser translation
  (translate="no" / notranslate on the page as a whole)
- every page declares lang="en" and UTF-8
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "website"
sys.path.insert(0, str(SITE))
errors = []


def fail(msg):
    errors.append(msg)


src = (SITE / "build_release.py").read_text(encoding="utf-8")
registry = re.findall(r"^\s+\('([a-z0-9-]+)', '(?:foundation|appendix|L\d)'", src, re.M)
manifest = [l.split("\t")[0] for l in (SITE / "pages/protocols/manifest.txt").read_text(encoding="utf-8").splitlines() if l.strip()]
files = sorted(p.stem for p in (SITE / "pages/protocols").glob("*.html"))
sitemap = sorted(set(re.findall(r"/pages/protocols/([a-z0-9-]+)\.html", (SITE / "sitemap.xml").read_text(encoding="utf-8"))))
index = (SITE / "pages/protocols.html").read_text(encoding="utf-8")
linked = sorted(set(re.findall(r'href="(?:/pages/)?protocols/([a-z0-9-]+)\.html"', index)))
if sorted(registry) != sorted(manifest):
    fail(f"REGISTRY vs manifest.txt: {sorted(set(registry) ^ set(manifest))}")
for name, got in (("page files", files), ("sitemap", sitemap), ("index links", linked)):
    if sorted(manifest) != got:
        fail(f"manifest vs {name}: {sorted(set(manifest) ^ set(got))}")
protocols = [s for s in manifest if s.startswith("dkp-") and not s.endswith("-patch")]
if f"{len(protocols)} protocols" not in index:
    fail(f"protocol index does not state '{len(protocols)} protocols'")

published = [p for p in SITE.rglob("*") if p.is_file() and p.suffix in (".html", ".js", ".css", ".xml", ".txt", ".json")
             and "tools" not in p.relative_to(SITE).parts and "docs" not in p.relative_to(SITE).parts]
for p in published:
    rel = p.relative_to(SITE).as_posix()
    text = p.read_text(encoding="utf-8", errors="replace")
    if rel.startswith("projects/protocol-lab/dist/"):
        continue
    if re.search(r"mazkira|ayalon|מזכירה", text, re.I):
        fail(f"removed project mentioned in {rel}")
    # Survival Manual: #lang-switch links two separately authored editions (Russian original, English); that is
    # content, not a translation service. The Lab page fills English labels via data-i18n (no switcher).
    ui = r'lang-select|lab-lang|"lab\.lang"\)\s*\|\||i18n\.js|converter-i18n|translate\.google|googleTranslateElement'
    if p.suffix in (".html", ".js") and re.search(ui, text):
        fail(f"custom translation UI in {rel}")
    if p.suffix == ".html" and "data-i18n" in text and not rel.startswith("projects/protocol-lab/"):
        fail(f"data-i18n placeholders in {rel}")
    if p.suffix == ".html":
        if re.search(r'<(?:html|body)[^>]*(?:translate="no"|class="[^"]*notranslate)', text):
            fail(f"page-wide translate=no/notranslate in {rel}")
        if 'lang="en"' not in text.split("<head", 1)[0]:
            fail(f"missing lang=\"en\" in {rel}")
        if not re.search(r'<meta charset="utf-8"', text, re.I):
            fail(f"missing UTF-8 charset in {rel}")
# Data-driven counts (2026-11-18): catalog.json = manifest; marked counts, both archive views, entries and links agree.
sys.path.insert(0, str(SITE / "tools"))
import catalog_counts  # noqa: E402
for e in catalog_counts.run():
    fail("counts: " + e)
# Classic archive view: its stylesheet must be exactly what tools/make_classic_css.py makes from the authentic source.
import make_classic_css  # noqa: E402
classic_css = SITE / make_classic_css.OUT_NAME
if not classic_css.is_file() or classic_css.read_text(encoding="utf-8") != make_classic_css.build():
    fail(f"{make_classic_css.OUT_NAME} differs from tools/make_classic_css.py output")
print(f"registry: {len(manifest)} documents ({len(protocols)} protocols); {len(published)} published files checked")
for e in errors:
    print("FAIL", e)
sys.exit(1 if errors else 0)
