# Publishing the protocols

The normative texts live in [anahronic/World](https://github.com/anahronic/World), folder `Dikenocracy/`
(one Markdown file per document, with `last_updated` in the front matter). This folder only holds
the website and the build.

```
pip install pypandoc-binary beautifulsoup4
python build_release.py --world ../../World --release-date YYYY-MM-DD --docx
```

One run regenerates, from the same sources: the protocol pages, `pages/protocols.html` (the protocol
count is computed from the sources), `pages/protocols/manifest.txt`, the protocol URLs in
`sitemap.xml`, `downloads/Dikenocracy SYNERGY and N PROTOCOLS.txt`, the DOCX files and
`SHA256SUMS.txt` in World. Commit both repositories, then copy the changed files to `/var/www/html`.

Dates: when a document changes, update `last_updated` in that document only. Rebuilding or changing
navigation does not move any document date. `--release-date` is the date of the full release shown on
the index and in the TXT. Changes to normative content go through DKP-4-UPGRADE-001; the date does
not certify a change.

New document: add its Markdown file in World and one line in `REGISTRY` in `build_release.py`
(the build refuses unregistered or missing documents and duplicate protocol IDs).
