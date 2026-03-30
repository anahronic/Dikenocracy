#!/usr/bin/env python3
"""
sync_protocols.py — Protocol Index, Navigation & Map Synchronisation Tool
=========================================================================
Single-source-of-truth for the Protocol Map sidebar, prev/next navigation,
and protocols.html index page.

All 35 protocol pages carry an identical Protocol Map sidebar (aside from
a per-page ``--active`` layer label and ``pmap-active`` link class).  This
script regenerates that sidebar from the canonical PROTOCOL_MAP_REGISTRY
below, so adding or reordering a protocol only requires editing this file
and re-running the tool.

Usage
-----
  python3 scripts/sync_protocols.py              # audit only (dry-run)
  python3 scripts/sync_protocols.py --fix        # fix map + navigation
  python3 scripts/sync_protocols.py --map-only   # regenerate maps only
  python3 scripts/sync_protocols.py --nav-only   # fix navigation only
"""

import argparse
import re
import sys
from pathlib import Path

# ──────────────────────────────────────────────────────────────────────
#  SINGLE SOURCE OF TRUTH — Protocol Map Registry
# ──────────────────────────────────────────────────────────────────────
PROTOCOL_MAP_REGISTRY = [
    ("Foundation", [
        ("code-of-planetary-synergy", "Synergy Code"),
    ]),
    ("L0 — Physical Truth", [
        ("dkp-0-oracle-001", "ORACLE"),
        ("dkp-0-time-001", "TIME"),
    ]),
    ("L1 — Core", [
        ("dkp-1-axioms-001", "AXIOMS"),
        ("dkp-1-identity-001", "IDENTITY"),
        ("dkp-1-impact-001", "IMPACT"),
        ("dkp-1-justice-001", "JUSTICE"),
        ("dkp-1-prevention-001", "PREVENTION"),
    ]),
    ("L2 — Economic", [
        ("dkp-2-assets-001", "ASSETS"),
        ("dkp-2-finance-001", "FINANCE"),
        ("dkp-2-labor-001", "LABOR"),
    ]),
    ("L3 — Security", [
        ("dkp-3-antiterror-001", "ANTITERROR"),
        ("dkp-3-defense-001", "DEFENSE"),
        ("dkp-3-internal-sec-001", "INTERNAL-SEC"),
        ("dkp-3-police-001", "POLICE"),
    ]),
    ("L4 — Stability", [
        ("dkp-4-crisis-001", "CRISIS"),
        ("dkp-4-error-001", "ERROR"),
        ("dkp-4-upgrade-001", "UPGRADE"),
    ]),
    ("L5 — Human Infra", [
        ("dkp-5-culture-001", "CULTURE"),
        ("dkp-5-edu-001", "EDU"),
        ("dkp-5-habitat-001", "HABITAT"),
        ("dkp-5-info-001", "INFO"),
        ("dkp-5-transport-001", "TRANSPORT"),
        ("dkp-5-work-cycle-001", "WORK-CYCLE"),
    ]),
    ("L6 — Intersystem", [
        ("dkp-6-exit-001", "EXIT"),
        ("dkp-6-integration-001", "INTEGRATION"),
        ("dkp-6-resilience-001", "RESILIENCE"),
    ]),
    ("L7 — Meta / Scope", [
        ("dkp-7-ai-subject-001", "AI-SUBJECT"),
        ("dkp-7-privacy-001", "PRIVACY"),
        ("dkp-7-scope-001", "SCOPE"),
        ("dkp-7-transparency-001", "TRANSPARENCY"),
    ]),
    ("L8 — Infrastructure", [
        ("dkp-8-audit-001", "AUDIT"),
        ("dkp-8-interop-001", "INTEROP"),
        ("dkp-8-simulation-001", "SIMULATION"),
    ]),
    ("Appendix", [
        ("appendix-a-design-rationale-safeguards-normative", "Appendix A"),
    ]),
]

# Flat canonical order derived from registry
CANONICAL_ORDER: list[str] = []
for _lbl, _protos in PROTOCOL_MAP_REGISTRY:
    for _slug, _name in _protos:
        CANONICAL_ORDER.append(_slug)

# Reverse lookup: slug -> layer label
_SLUG_TO_LAYER: dict[str, str] = {}
for _lbl, _protos in PROTOCOL_MAP_REGISTRY:
    for _slug, _name in _protos:
        _SLUG_TO_LAYER[_slug] = _lbl

# ──────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
PROTO_DIR = ROOT / "pages" / "protocols"
INDEX_FILE = ROOT / "pages" / "protocols.html"


# ──────────────────────────────────────────────────────────────────────
#  PROTOCOL MAP GENERATOR  (single source)
# ──────────────────────────────────────────────────────────────────────
def generate_protocol_map(current_slug: str) -> str:
    """Generate the canonical <aside class="protocol-map"> block."""
    current_layer = _SLUG_TO_LAYER.get(current_slug, "")
    I = "      "   # base indent (6 spaces, inside protocol-shell)
    LI = I + "        "  # 14 spaces for <li>

    lines = [
        f'{I}<aside class="protocol-map" aria-label="Protocol map">',
        f'{I}  <div class="protocol-map__heading">Protocol Map</div>',
    ]

    for layer_label, protos in PROTOCOL_MAP_REGISTRY:
        is_active = (layer_label == current_layer)
        cls = "protocol-map__layer-label"
        if is_active:
            cls += " protocol-map__layer-label--active"

        lines.append(f'{I}  <div class="protocol-map__layer">')
        lines.append(f'{I}    <span class="{cls}">{layer_label}</span>')
        lines.append(f'{I}    <ul class="protocol-map__links">')

        for slug, name in protos:
            if slug == current_slug:
                lines.append(f'{LI}<li><a href="{slug}.html" class="pmap-active">{name}</a></li>')
            else:
                lines.append(f'{LI}<li><a href="{slug}.html">{name}</a></li>')

        lines.append(f'{I}    </ul>')
        lines.append(f'{I}  </div>')

    lines.append(f'{I}</aside>')
    return "\n".join(lines)


def stamp_protocol_map(slug: str, html: str) -> str:
    """Replace existing protocol-map aside with canonical version."""
    new_map = generate_protocol_map(slug)
    return re.sub(
        r'<aside class="protocol-map".*?</aside>',
        new_map.strip(),
        html, count=1, flags=re.DOTALL,
    )


def fix_maps() -> int:
    changed = 0
    for slug in CANONICAL_ORDER:
        fp = PROTO_DIR / f"{slug}.html"
        if not fp.exists():
            print(f"  ⚠  {slug}.html not found — skipped")
            continue
        html = fp.read_text(encoding="utf-8")
        new_html = stamp_protocol_map(slug, html)
        if new_html != html:
            fp.write_text(new_html, encoding="utf-8")
            changed += 1
    return changed


# ──────────────────────────────────────────────────────────────────────
#  MAP AUDIT
# ──────────────────────────────────────────────────────────────────────
def audit_maps() -> list[str]:
    errors = []
    for slug in CANONICAL_ORDER:
        fp = PROTO_DIR / f"{slug}.html"
        if not fp.exists():
            errors.append(f"  MISSING FILE: {slug}.html")
            continue

        html = fp.read_text(encoding="utf-8")
        m = re.search(r'(<aside class="protocol-map".*?</aside>)', html, re.DOTALL)
        if not m:
            errors.append(f"  {slug}: NO protocol-map block found")
            continue

        actual = m.group(1).strip()
        expected = generate_protocol_map(slug).strip()

        if actual != expected:
            errors.append(f"  {slug}: map differs from canonical source (exact)")

        links = re.findall(r'href="([^"]+)"', m.group(1))
        if len(links) != len(set(links)):
            dupes = [l for l in links if links.count(l) > 1]
            errors.append(f"  {slug}: DUPLICATE links: {set(dupes)}")

        map_text = m.group(1).lower()
        if "dkp-1-prevention-001.html" not in map_text:
            errors.append(f"  {slug}: PREVENTION missing from map")
        if "dkp-6-resilience-001.html" not in map_text:
            errors.append(f"  {slug}: RESILIENCE missing from map")

        expected_count = sum(len(p) for _, p in PROTOCOL_MAP_REGISTRY)
        if len(links) != expected_count:
            errors.append(f"  {slug}: has {len(links)} links, expected {expected_count}")

    return errors


# ──────────────────────────────────────────────────────────────────────
#  METADATA EXTRACTION
# ──────────────────────────────────────────────────────────────────────
def extract_meta(slug: str) -> dict:
    fp = PROTO_DIR / f"{slug}.html"
    if not fp.exists():
        return {"slug": slug, "file": str(fp), "missing": True}

    html = fp.read_text(encoding="utf-8")
    info = {"slug": slug, "file": str(fp), "missing": False}

    m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.DOTALL)
    info["h1"] = m.group(1).strip() if m else slug.upper()

    m = re.search(r'<div class="protocol-meta">(.*?)</div>', html, re.DOTALL)
    if m:
        meta_text = m.group(1)
        vm = re.search(r"Version:\s*([\d.]+)", meta_text)
        sm = re.search(r"Status:\s*(\w[\w\s]*\w|\w)", meta_text)
        info["version"] = vm.group(1) if vm else "–"
        info["status"] = sm.group(1).strip() if sm else "–"
    else:
        info["version"] = "–"
        info["status"] = "–"

    pm = re.search(r'protocol-side-nav--prev.*?href="([^"]+)"', html, re.DOTALL)
    nm = re.search(r'protocol-side-nav--next.*?href="([^"]+)"', html, re.DOTALL)
    info["nav_prev"] = pm.group(1) if pm else None
    info["nav_next"] = nm.group(1) if nm else None

    return info


# ──────────────────────────────────────────────────────────────────────
#  NAVIGATION AUDIT & FIX
# ──────────────────────────────────────────────────────────────────────
def audit_navigation() -> list[str]:
    errors = []
    for idx, slug in enumerate(CANONICAL_ORDER):
        meta = extract_meta(slug)
        if meta.get("missing"):
            errors.append(f"  MISSING FILE: {slug}.html")
            continue
        exp_prev = f"{CANONICAL_ORDER[idx-1]}.html" if idx > 0 else None
        exp_next = f"{CANONICAL_ORDER[idx+1]}.html" if idx < len(CANONICAL_ORDER) - 1 else None
        if meta["nav_prev"] != exp_prev:
            errors.append(f"  {slug}: prev={meta['nav_prev']}  expected={exp_prev}")
        if meta["nav_next"] != exp_next:
            errors.append(f"  {slug}: next={meta['nav_next']}  expected={exp_next}")
    return errors


def display_label(slug: str) -> str:
    if slug == "code-of-planetary-synergy":
        return "Code of Planetary Synergy"
    if slug.startswith("appendix-a"):
        return "Appendix A"
    return slug.upper().replace(".HTML", "")


def fix_navigation() -> int:
    changed = 0
    for idx, slug in enumerate(CANONICAL_ORDER):
        fp = PROTO_DIR / f"{slug}.html"
        if not fp.exists():
            continue
        html = fp.read_text(encoding="utf-8")
        original = html

        prev_slug = CANONICAL_ORDER[idx - 1] if idx > 0 else None
        next_slug = CANONICAL_ORDER[idx + 1] if idx < len(CANONICAL_ORDER) - 1 else None

        parts = ['  <div class="protocol-side-nav-layer" aria-hidden="true">']
        if prev_slug:
            lbl = display_label(prev_slug)
            parts += [
                '    <div class="protocol-side-nav protocol-side-nav--prev">',
                f'      <a class="protocol-side-nav__btn" href="{prev_slug}.html" aria-label="Previous protocol: {lbl}">',
                '        <span class="nav-arrow">&lsaquo;</span>',
                f'        <span class="nav-label">{lbl}</span>',
                '      </a>',
                '    </div>',
            ]
        if next_slug:
            lbl = display_label(next_slug)
            parts += [
                '    <div class="protocol-side-nav protocol-side-nav--next">',
                f'      <a class="protocol-side-nav__btn" href="{next_slug}.html" aria-label="Next protocol: {lbl}">',
                f'        <span class="nav-label">{lbl}</span>',
                '        <span class="nav-arrow">&rsaquo;</span>',
                '      </a>',
                '    </div>',
            ]
        parts.append('  </div>')
        new_sidenav = "\n".join(parts)

        html = re.sub(
            r'  <div class="protocol-side-nav-layer".*?</div>\s*</div>\s*(?=\n\s*<main)',
            new_sidenav + "\n\n",
            html, count=1, flags=re.DOTALL,
        )

        bnav = ['        <nav class="protocol-nav-bottom" aria-label="Protocol navigation">']
        if prev_slug:
            lbl = display_label(prev_slug)
            bnav.append(f'          <a class="btn" href="{prev_slug}.html" aria-label="Previous protocol: {lbl}">&larr; Previous Protocol</a>')
        else:
            bnav.append('          <span class="protocol-nav-bottom__spacer"></span>')
        if next_slug:
            lbl = display_label(next_slug)
            bnav.append(f'          <a class="btn" href="{next_slug}.html" aria-label="Next protocol: {lbl}">Next Protocol &rarr;</a>')
        else:
            bnav.append('          <span class="protocol-nav-bottom__spacer"></span>')
        bnav.append('        </nav>')
        new_bnav = "\n".join(bnav)

        html = re.sub(
            r'        <nav class="protocol-nav-bottom".*?</nav>',
            new_bnav, html, count=1, flags=re.DOTALL,
        )

        if html != original:
            fp.write_text(html, encoding="utf-8")
            changed += 1
    return changed


# ──────────────────────────────────────────────────────────────────────
#  INDEX VALIDATION
# ──────────────────────────────────────────────────────────────────────
def audit_index() -> list[str]:
    if not INDEX_FILE.exists():
        return ["  protocols.html not found"]
    html = INDEX_FILE.read_text(encoding="utf-8")
    errors = []
    for slug in CANONICAL_ORDER:
        if f"protocols/{slug}.html" not in html:
            errors.append(f"  Missing from index: {slug}")
    return errors


# ──────────────────────────────────────────────────────────────────────
#  MAIN
# ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Protocol sync tool — single source of truth for map, nav, index."
    )
    parser.add_argument("--fix", action="store_true",
                        help="Fix Protocol Maps AND navigation chains")
    parser.add_argument("--map-only", action="store_true",
                        help="Regenerate Protocol Maps only")
    parser.add_argument("--nav-only", action="store_true",
                        help="Fix navigation chains only")
    args = parser.parse_args()

    do_fix_map = args.fix or args.map_only
    do_fix_nav = args.fix or args.nav_only

    print("=" * 64)
    print("  Dikenocracy Protocol Sync Tool  (single-source registry)")
    print("=" * 64)

    # 1. File inventory
    files_on_disk = sorted(f.stem for f in PROTO_DIR.glob("*.html"))
    canonical_set = set(CANONICAL_ORDER)
    disk_set = set(files_on_disk)
    new_files = disk_set - canonical_set
    missing_files = canonical_set - disk_set

    print(f"\n📁 Files on disk: {len(files_on_disk)}")
    print(f"📋 Registry: {len(CANONICAL_ORDER)}")
    if new_files:
        print(f"  ⚠  On disk but NOT in registry: {sorted(new_files)}")
    if missing_files:
        print(f"  ✗  In registry but MISSING on disk: {sorted(missing_files)}")
    if not new_files and not missing_files:
        print("  ✓  File count matches registry")

    # 2. Metadata
    print("\n─── Metadata ───")
    for slug in CANONICAL_ORDER:
        meta = extract_meta(slug)
        if meta.get("missing"):
            print(f"  ✗ {slug:50s}  MISSING")
        else:
            print(f"  ✓ {meta['h1']:50s}  v{meta['version']}  {meta['status']}")

    # 3. Protocol Map audit
    print("\n─── Protocol Map (sidebar) ───")
    if do_fix_map:
        print("  Regenerating maps from registry...")
        changed = fix_maps()
        print(f"  ✓ {changed} files stamped from canonical source")
    map_errors = audit_maps()
    if map_errors:
        print("  ISSUES:")
        for e in map_errors:
            print(e)
    else:
        print(f"  ✓ All {len(CANONICAL_ORDER)} pages: map matches canonical source (exact)")

    # 4. Navigation audit
    print("\n─── Navigation Chain ───")
    nav_errors = audit_navigation()
    if nav_errors:
        print("  ERRORS:")
        for e in nav_errors:
            print(e)
        if do_fix_nav:
            print("\n  Fixing navigation...")
            changed = fix_navigation()
            print(f"  ✓ {changed} files updated")
            nav_errors2 = audit_navigation()
            if nav_errors2:
                print("  ⚠  Still have errors:")
                for e in nav_errors2:
                    print(e)
            else:
                print("  ✓ Navigation chain verified clean")
    else:
        print(f"  ✓ All {len(CANONICAL_ORDER)} pages: navigation chain correct")

    # 5. Index audit
    print("\n─── Index (protocols.html) ───")
    idx_errors = audit_index()
    if idx_errors:
        for e in idx_errors:
            print(e)
    else:
        print(f"  ✓ All {len(CANONICAL_ORDER)} protocols listed in index")

    total = len(map_errors) + len(nav_errors) + len(idx_errors) + len(new_files) + len(missing_files)
    print("\n" + "=" * 64)
    if total == 0:
        print("  ✓ ALL CHECKS PASSED")
    else:
        print(f"  {total} issue(s) found", end="")
        if not (do_fix_map or do_fix_nav):
            print(" — run with --fix to repair")
        else:
            print("")
    print("=" * 64)
    return 0 if total == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
