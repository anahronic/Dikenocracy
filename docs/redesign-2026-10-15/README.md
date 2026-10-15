# Redesign of 2026-10-15 — summary

Branch `premium-redesign` (from `site-redesign`). Not deployed. Decisions: `DIRECTION.md`; product facts: `PRODUCT.md`.

## Preview

    cd website && python -m http.server 8765 --bind 127.0.0.1
    open http://127.0.0.1:8765/

The Survival Manual is not in the repo; to preview it with the new stylesheet:
`python "E:\004 POST NUCLEAR SURVIVAL MANUAL\build_survival.py" --site-root website --output-dir website/survival` (git-ignored).
Before/after screenshots: `compare.html` in this folder (images are git-ignored, kept locally).

## What changed

- One stylesheet, `styles-20261015.css`, built by `tools/build_site_css.py` from `tools/site.css` and self-hosted
  Libre Franklin + Source Serif 4 (`assets/fonts/`, OFL). Old `styles-20261014.css`/`protocols-20261014.css`,
  `icons-20261013.svg` and `covers/*-20261013.svg` stay until the deploy, because production still uses them.
- Shared chrome in `build_release.py` (navigation with the current section, "Read the Code" action, new footer with the
  full-width wordmark); `tools/apply_chrome.py` applies it to the hand-written pages.
- Home, About, Projects, Converter info, Ayalon, 404 rebuilt on the new components with their existing texts. New wording,
  for the owner to confirm: the four principle headings on the home page set as statements ("Reality is measured first.",
  "Then the rule applies.", "Every rule is public.", "No one holds unchecked power."), the home slogan tile
  "Alongside the old world" (from the footer line), short project captions on the home page, the dateline, the
  "Page not found" title on the 404 page, and labels such as "Release", "Canonical texts", "All layers", "On this page".
- Protocol index: search, layer filter, last-updated dates, layer notes; anchors (`l0-heading` …) unchanged.
- Protocol pages: breadcrumb, human title under the identifier, rail with this layer's documents and the contents
  (current section marked), titled previous/next, reading progress. The visible text, heading anchors and links of every article are unchanged;
  code blocks got `tabindex="0"` so they scroll from the keyboard.
- `site-20261015.js`: navigation shadow, live dateline (today in Gregorian, Hebrew and DTI via `converter/converter.js`),
  section entrances below the fold, explorer filter. All of it degrades to plain content without script.
- Artwork: `tools/make_art.cjs` (duotone crops of the project's own illustration, stack and dot-field drawings),
  `tools/make_covers.py` recoloured. Prompts for the generated illustration set: `website/tools/art-src/prompts.md`.

## Checks

- `python website/tools/check_content.py 6d9497c` — 38/38 protocol bodies (text, anchors, links) identical to the last commit before the redesign.
- `node website/tools/qa_site.cjs http://127.0.0.1:8765 <dir>` (with `AXE=<axe.min.js>`) — 203/203: content and copy checks,
  prev/next chain, contents anchors, 13 pages × 3 widths (errors, overflow, images, fragments, touch targets), keyboard,
  axe-core WCAG 2.2 AA.
- `python website/tools/check_links.py http://127.0.0.1:8765` — no broken local links (48 pages incl. Survival).
- Taste `lint.mjs` 0 FAIL; `inspect.mjs` 1 FAIL (two existing headlines run to three lines at 390px, see open questions).
- Dev-only stress page: `website/tools/stress/break-ui.html?data=worst|empty|one`.

## Open questions for the owner

- Headline "Justice as a function, not a metaphor." and "Nine layers, from physical truth to infrastructure." take three
  lines on phones. Shortening them is a copy decision.
- The illustration set could not be generated (OpenAI balance exhausted); the page slots take the new pictures as is.
- Shadoo (`/shadoo/`) keeps its own patched skin and the old navigation logo until it is re-patched with `tools/shadoo/`.
- `/survival/` must be rebuilt with `build_survival.py --site-root` at deploy, because it reads the stylesheet name.
