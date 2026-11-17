"""Writes the deployable-site manifest: commit, and SHA-256 of every file that is copied to /var/www/html.
Usage: python ci/release_manifest.py > release-manifest.json
Production adds one Keeper loader line to each routed HTML page at deploy time; compare HTML without that line."""
import hashlib
import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "website"
SKIP_DIRS = {"tools", "docs", "__pycache__", "errors", "survival"}
SKIP_FILES = {"build_release.py", "RELEASE.md", "SITE_AUDIT.md", ".gitignore"}
commit = subprocess.run(["git", "-C", str(ROOT), "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
files = {}
for p in sorted(SITE.rglob("*")):
    rel = p.relative_to(SITE)
    if p.is_file() and not (set(rel.parts) & SKIP_DIRS) and p.name not in SKIP_FILES:
        files[rel.as_posix()] = hashlib.sha256(p.read_bytes()).hexdigest()
errors = {p.relative_to(SITE).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((SITE / "errors").glob("*"))}
print(json.dumps({"schema": "dkp-site-release/1", "commit": commit, "webroot": files,
                  "error_pages (/var/www/dkp-errors)": errors}, indent=1))
