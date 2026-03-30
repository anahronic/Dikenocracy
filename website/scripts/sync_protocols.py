#!/usr/bin/env python3
"""
sync_protocols.py — Protocol Index & Navigation Synchronisation Tool
====================================================================
Scans every HTML file in  pages/protocols/  to:

 1. Extract metadata (h1 title, version, status, layer, dependencies).
 2. Validate the prev/next navigation chain across all 35 pages.
 3. Optionally regenerate the protocol-map sidebar and main-content
    sections of  pages/protocols.html  so file-count ≡ entry-count.

Usage
-----
  python3 scripts/sync_protocols.py              # audit only (dry-run)
  python3 scripts/sync_protocols.py --fix        # fix navigation + regenerate index
  python3 scripts/sync_protocols.py --nav-only   # fix navigation chain only

The canonical page order is defined by CANONICAL_ORDER below.
"""

import argparse
import os
import re
import sys
from pathlib import Path

# ──────────────────────────────────────────────────────────────────────
# CANONICAL ORDER  (35 pages)
# ──────────────────────────────────────────────────────────────────────
CANONICAL_ORDER = [
    "code-of-planetary-synergy",
    "dkp-0-oracle-001",
    "dkp-0-time-001",
    "dkp-1-axioms-001",
    "dkp-1-identity-001",
    "dkp-1-impact-001",
    "dkp-1-justice-001",
    "dkp-1-prevention-001",
    "dkp-2-assets-001",
    "dkp-2-finance-001",
    "dkp-2-labor-001",
    "dkp-3-antiterror-001",
    "dkp-3-defense-001",
    "dkp-3-internal-sec-001",
    "dkp-3-police-001",
    "dkp-4-crisis-001",
    "dkp-4-error-001",
    "dkp-4-upgrade-001",
    "dkp-5-culture-001",
    "dkp-5-edu-001",
    "dkp-5-habitat-001",
    "dkp-5-info-001",
    "dkp-5-transport-001",
    "dkp-5-work-cycle-001",
    "dkp-6-exit-001",
    "dkp-6-integration-001",
    "dkp-6-resilience-001",
    "dkp-7-ai-subject-001",
    "dkp-7-privacy-001",
    "dkp-7-scope-001",
    "dkp-7-transparency-001",
    "dkp-8-audit-001",
    "dkp-8-interop-001",
    "dkp-8-simulation-001",
    "appendix-a-design-rationale-safeguards-normative",
]

# Layer grouping for the index page
LAYER_GROUPS = [
    ("Foundation",           "foundation-heading",  None, ["code-of-planetary-synergy"]),
    ("L0 — Physical Truth",  "l0-heading",
     "The foundation layer. Defines how observable physical reality is captured, verified, and made available to higher layers.",
     ["dkp-0-oracle-001", "dkp-0-time-001"]),
    ("L1 — Core",            "l1-heading",
     "Foundational axioms, identity attribution, impact measurement, and justice invariants that all higher layers must respect.",
     ["dkp-1-axioms-001", "dkp-1-identity-001", "dkp-1-impact-001", "dkp-1-justice-001", "dkp-1-prevention-001"]),
    ("L2 — Economic",        "l2-heading",
     "Dual-circuit economy rules, tokenized value chains, conditional emission, and stake-based security mechanisms.",
     ["dkp-2-assets-001", "dkp-2-finance-001", "dkp-2-labor-001"]),
    ("L3 — Security",        "l3-heading",
     "Defense, counter-terrorism, internal security, and physical enforcement within strict constraint boundaries.",
     ["dkp-3-antiterror-001", "dkp-3-defense-001", "dkp-3-internal-sec-001", "dkp-3-police-001"]),
    ("L4 — Stability",       "l4-heading",
     "Crisis handling, error correction, and controlled protocol upgrade mechanisms.",
     ["dkp-4-crisis-001", "dkp-4-error-001", "dkp-4-upgrade-001"]),
    ("L5 — Human Infrastructure", "l5-heading",
     "Culture, education, habitat, information, transport, and work-cycle standards for physical and cognitive dignity.",
     ["dkp-5-culture-001", "dkp-5-edu-001", "dkp-5-habitat-001", "dkp-5-info-001", "dkp-5-transport-001", "dkp-5-work-cycle-001"]),
    ("L6 — Intersystem",     "l6-heading",
     "Entry and exit protocols for jurisdictions interfacing with the Dikenocracy system.",
     ["dkp-6-exit-001", "dkp-6-integration-001", "dkp-6-resilience-001"]),
    ("L7 — Meta / Scope",    "l7-heading",
     "Applicability boundaries, privacy hard limits, transparency requirements, and AI subject constraints.",
     ["dkp-7-ai-subject-001", "dkp-7-privacy-001", "dkp-7-scope-001", "dkp-7-transparency-001"]),
    ("L8 — Infrastructure",  "l8-heading",
     "Continuous audit, external interoperability, and simulation &amp; validation engines.",
     ["dkp-8-audit-001", "dkp-8-interop-001", "dkp-8-simulation-001"]),
    ("Appendix",             "appendix-heading", None,
     ["appendix-a-design-rationale-safeguards-normative"]),
]

# ──────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
PROTO_DIR = ROOT / "pages" / "protocols"
INDEX_FILE = ROOT / "pages" / "protocols.html"


# ──────────────────────────────────────────────────────────────────────
# METADATA EXTRACTION
# ──────────────────────────────────────────────────────────────────────
def extract_meta(slug: str) -> dict:
    """Return {slug, file, h1, subtitle, version, status, layer_tag} for a page."""
    fp = PROTO_DIR / f"{slug}.html"
    if not fp.exists():
        return {"slug": slug, "file": str(fp), "missing": True}

    html = fp.read_text(encoding="utf-8")
    info = {"slug": slug, "file": str(fp), "missing": False}

    # h1
    m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.DOTALL)
    info["h1"] = m.group(1).strip() if m else slug.upper()

    # First h3 after h1 — subtitle/description
    m = re.search(r"</h1>.*?<h3[^>]*>(.*?)</h3>", html, re.DOTALL)
    info["subtitle"] = m.group(1).strip() if m else ""

    # protocol-meta block
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

    # Navigation links (side-nav)
    pm = re.search(r'protocol-side-nav--prev.*?href="([^"]+)"', html, re.DOTALL)
    nm = re.search(r'protocol-side-nav--next.*?href="([^"]+)"', html, re.DOTALL)
    info["nav_prev"] = pm.group(1) if pm else None
    info["nav_next"] = nm.group(1) if nm else None

    return info


# ──────────────────────────────────────────────────────────────────────
# NAVIGATION AUDIT
# ──────────────────────────────────────────────────────────────────────
def audit_navigation() -> list[str]:
    """Return list of error strings (empty = clean)."""
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


# ──────────────────────────────────────────────────────────────────────
# NAVIGATION FIX
# ──────────────────────────────────────────────────────────────────────
def display_label(slug: str) -> str:
    """Readable label for side-nav."""
    if slug == "code-of-planetary-synergy":
        return "Code of Planetary Synergy"
    if slug.startswith("appendix-a"):
        return "Appendix A"
    return slug.upper().replace(".HTML", "")


def fix_navigation():
    """Rewrite side-nav and bottom-nav blocks in every protocol page."""
    changed = 0
    for idx, slug in enumerate(CANONICAL_ORDER):
        fp = PROTO_DIR / f"{slug}.html"
        if not fp.exists():
            print(f"  ⚠  {slug}.html not found — skipped")
            continue

        html = fp.read_text(encoding="utf-8")
        original = html

        prev_slug = CANONICAL_ORDER[idx - 1] if idx > 0 else None
        next_slug = CANONICAL_ORDER[idx + 1] if idx < len(CANONICAL_ORDER) - 1 else None

        # ── Build new side-nav block ──
        parts = ['  <div class="protocol-side-nav-layer" aria-hidden="true">']
        if prev_slug:
            lbl = display_label(prev_slug)
            parts.append(f'    <div class="protocol-side-nav protocol-side-nav--prev">')
            parts.append(f'      <a class="protocol-side-nav__btn" href="{prev_slug}.html" aria-label="Previous protocol: {lbl}">')
            parts.append(f'        <span class="nav-arrow">&lsaquo;</span>')
            parts.append(f'        <span class="nav-label">{lbl}</span>')
            parts.append(f'      </a>')
            parts.append(f'    </div>')
        if next_slug:
            lbl = display_label(next_slug)
            parts.append(f'    <div class="protocol-side-nav protocol-side-nav--next">')
            parts.append(f'      <a class="protocol-side-nav__btn" href="{next_slug}.html" aria-label="Next protocol: {lbl}">')
            parts.append(f'        <span class="nav-label">{lbl}</span>')
            parts.append(f'        <span class="nav-arrow">&rsaquo;</span>')
            parts.append(f'      </a>')
            parts.append(f'    </div>')
        parts.append('  </div>')
        new_sidenav = "\n".join(parts)

        # Replace existing side-nav block
        html = re.sub(
            r'  <div class="protocol-side-nav-layer".*?</div>\s*</div>\s*(?=\n\s*<main)',
            new_sidenav + "\n\n",
            html,
            count=1,
            flags=re.DOTALL,
        )

        # ── Build new bottom-nav block ──
        bnav_parts = ['        <nav class="protocol-nav-bottom" aria-label="Protocol navigation">']
        if prev_slug:
            lbl = display_label(prev_slug)
            bnav_parts.append(f'          <a class="btn" href="{prev_slug}.html" aria-label="Previous protocol: {lbl}">&larr; Previous Protocol</a>')
        else:
            bnav_parts.append('          <span class="protocol-nav-bottom__spacer"></span>')
        if next_slug:
            lbl = display_label(next_slug)
            bnav_parts.append(f'          <a class="btn" href="{next_slug}.html" aria-label="Next protocol: {lbl}">Next Protocol &rarr;</a>')
        else:
            bnav_parts.append('          <span class="protocol-nav-bottom__spacer"></span>')
        bnav_parts.append('        </nav>')
        new_bnav = "\n".join(bnav_parts)

        html = re.sub(
            r'        <nav class="protocol-nav-bottom".*?</nav>',
            new_bnav,
            html,
            count=1,
            flags=re.DOTALL,
        )

        if html != original:
            fp.write_text(html, encoding="utf-8")
            changed += 1

    return changed


# ──────────────────────────────────────────────────────────────────────
# INDEX VALIDATION
# ──────────────────────────────────────────────────────────────────────
def audit_index() -> list[str]:
    """Check protocols.html contains a link for every protocol file."""
    if not INDEX_FILE.exists():
        return ["  protocols.html not found"]

    html = INDEX_FILE.read_text(encoding="utf-8")
    errors = []
    for slug in CANONICAL_ORDER:
        href = f"protocols/{slug}.html"
        if href not in html:
            errors.append(f"  Missing from index: {slug}")
    return errors


# ──────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Protocol sync & validation tool")
    parser.add_argument("--fix", action="store_true", help="Fix navigation chains")
    parser.add_argument("--nav-only", action="store_true", help="Fix navigation only (alias for --fix)")
    args = parser.parse_args()

    do_fix = args.fix or args.nav_only

    print("=" * 60)
    print("  Dikenocracy Protocol Sync Tool")
    print("=" * 60)

    # 1. File inventory
    files_on_disk = sorted(f.stem for f in PROTO_DIR.glob("*.html"))
    canonical_set = set(CANONICAL_ORDER)
    disk_set = set(files_on_disk)

    new_files = disk_set - canonical_set
    missing_files = canonical_set - disk_set

    print(f"\n📁 Files on disk: {len(files_on_disk)}")
    print(f"📋 Canonical order: {len(CANONICAL_ORDER)}")
    if new_files:
        print(f"  ⚠  Files NOT in canonical order: {sorted(new_files)}")
    if missing_files:
        print(f"  ✗  Files MISSING from disk: {sorted(missing_files)}")
    if not new_files and not missing_files:
        print("  ✓  File count matches canonical order")

    # 2. Metadata summary
    print("\n─── Metadata ───")
    for slug in CANONICAL_ORDER:
        meta = extract_meta(slug)
        if meta.get("missing"):
            print(f"  ✗ {slug:50s}  MISSING")
        else:
            print(f"  ✓ {meta['h1']:50s}  v{meta['version']}  {meta['status']}")

    # 3. Navigation audit
    print("\n─── Navigation Chain ───")
    nav_errors = audit_navigation()
    if nav_errors:
        print("  ERRORS:")
        for e in nav_errors:
            print(e)
        if do_fix:
            print("\n  Fixing navigation...")
            changed = fix_navigation()
            print(f"  ✓ {changed} files updated")
            # Re-verify
            nav_errors2 = audit_navigation()
            if nav_errors2:
                print("  ⚠  Still have errors after fix:")
                for e in nav_errors2:
                    print(e)
            else:
                print("  ✓ Navigation chain verified clean")
    else:
        print("  ✓ All 35 pages: navigation chain is correct")

    # 4. Index audit
    print("\n─── Index (protocols.html) ───")
    idx_errors = audit_index()
    if idx_errors:
        for e in idx_errors:
            print(e)
    else:
        print(f"  ✓ All {len(CANONICAL_ORDER)} protocols listed in index")

    # Summary
    total_errors = len(nav_errors) + len(idx_errors) + len(new_files) + len(missing_files)
    print("\n" + "=" * 60)
    if total_errors == 0:
        print("  ✓ ALL CHECKS PASSED")
    else:
        print(f"  {total_errors} issue(s) found", end="")
        if not do_fix:
            print(" — run with --fix to repair navigation")
        else:
            print("")
    print("=" * 60)

    return 0 if total_errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
