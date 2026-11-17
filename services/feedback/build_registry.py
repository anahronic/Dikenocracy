"""Builds registry.json for the feedback service from the canonical World checkout.

    python services/feedback/build_registry.py <World checkout> <website dir> <out registry.json>
Each published protocol page (website/pages/protocols/manifest.txt) is mapped to its canonical Markdown file: id and
last_updated from the front matter, sha256 from World's SHA256SUMS.txt. The build fails if any page has no source.
"""
import hashlib
import json
import pathlib
import re
import sys

world, site, out = (pathlib.Path(a) for a in sys.argv[1:4])
sums = {}
for line in (world / "SHA256SUMS.txt").read_text(encoding="utf-8").splitlines():
    m = re.match(r"([0-9a-f]{64})\s+\*?(.+)$", line)
    if m:
        sums[m.group(2).strip()] = m.group(1)
by_slug = {}
for md in (world / "Dikenocracy").rglob("*.md"):
    text = md.read_text(encoding="utf-8")
    fm = re.match(r"^---\n(.*?)\n---", text, re.S)
    if not fm:
        continue
    keys = dict(re.findall(r"^(\w+):\s*\"?(.*?)\"?\s*$", fm.group(1), re.M))
    rel = md.relative_to(world).as_posix()
    digest = sums.get(rel) or hashlib.sha256(md.read_bytes()).hexdigest()
    by_slug[keys["slug"]] = {"slug": keys["slug"], "id": keys["id"], "kind": keys.get("kind"),
                             "last_updated": keys.get("last_updated"), "sha256": digest, "source": rel}
docs, missing = [], []
for line in (site / "pages" / "protocols" / "manifest.txt").read_text(encoding="utf-8").splitlines():
    slug = line.split("\t")[0].strip()
    if slug:
        (docs.append(by_slug[slug]) if slug in by_slug else missing.append(slug))
if missing:
    sys.exit(f"pages without a canonical source: {missing}")
commit = (world / ".git").exists() and __import__("subprocess").run(
    ["git", "-C", str(world), "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
out.write_text(json.dumps({"schema": "dkp-feedback-registry/1", "world_commit": commit or None, "documents": docs},
                          ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(f"registry: {len(docs)} documents -> {out}")
