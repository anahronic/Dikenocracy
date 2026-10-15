# Direction — dikenocracy.com

Decided 2026-10-14 with the Taste skill (`design-taste-frontend`), checked against Impeccable's craft floor.
Product facts live in `PRODUCT.md`. This file holds the visual and interaction decisions; reuse them, do not redraw them.

## Dials

Design variance 7 · motion intensity 3 · visual density 4.

## Direction: the printed annual

Taste draw: direction `editorial-report` (seed 1222816927, sector nonprofit, tone editorial, sheet in `.taste-skill/direction.json`).
The site is laid out like a well-edited printed report: a masthead image, tight oversized titles, text held to a column line,
and colour used in solid blocks the way a two-colour print job would. The reader should feel that someone edited this.

**The idea.** On this site, *the framework's own material* (the Code's Main Equation of Civilization Motion, the 35 protocol
identifiers in nine layers, the DTI calendar) becomes *the report's figures, index tables and dateline*. Nothing decorative
stands in for it: no scales, no statues, no icons in tinted boxes.

**The live thing.** The masthead dateline shows today's date in three calendars (Gregorian, Hebrew and DTI), computed in the
browser by the canonical `converter/converter.js`. Without script it is a plain link to the converter.

Redraws (with reasons, as the skill requires):
- **Palette** `burgundy-bubblegum` → `cool-grey-cobalt`. A burgundy ground with pink text is a dark page; visitors called the
  previous dark site depressing and the owner asked for a light site (PRODUCT.md), and pink on burgundy does not carry
  multi-thousand-word protocols.
- **Type** `boska-roman-italic` (and the redrawn `bodoni-jost`) → `franklin-source`, chosen from the skill's library. Both dealt
  systems are ceremony faces (perfume, weddings, fashion); the reading pages need Latin, Cyrillic and Greek (δίκη), mathematical
  signs and tabular figures, and serif display type is part of what read as "law office".
- **Hero geometry.** The dealt hero is a void; the direction's own composition calls for a masthead image band. The sheet ranks
  the direction above the hero blueprint, so the masthead wins.

## Colour

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#eef0f3` | page ground (cool pale grey) |
| `--surface` | `#e2e5ea` | one tone step: code, table heads, rail, tiles |
| `--surface-2` | `#d5d9e0` | second step: hover on surfaces |
| `--ink` | `#0b0c0e` | all running text, headings |
| `--muted` | `#555c68` | secondary notes only (5.6:1 on `--bg`) |
| `--accent` | `#1f2de6` | cobalt: the primary button, links, the current item, one full field per page |
| `--accent-hover` | `#1520b8` | pressed/hover cobalt |
| `--accent-ink` | `#ffffff` | text on cobalt |
| `--night` | `#0b0c0e` | inverted closes: the final call to action and the footer |
| `--on-night` | `#eef0f3` / `--on-night-muted` `#a7aebb` | text on the inverted field |

One ground, one ink, one accent. Surfaces are separated by a tone step, never by a line or a shadow (tables and form fields keep
their lines). Shadows only on things that float (the Projects submenu). Selection, caret, scrollbars and focus rings are themed
from this palette.

## Type

Self-hosted variable fonts in `website/assets/fonts/` (no third-party font requests): **Libre Franklin** (display and interface)
and **Source Serif 4** (reading text). Two faces, never a third. Code blocks use the system monospace stack (`ui-monospace`,
Consolas); monospace appears nowhere else.

| Step | Size | Face / setting |
| --- | --- | --- |
| display | `clamp(2.75rem, 1.4rem + 4.6vw, 6rem)` | Franklin 700, tracking -0.035em, leading 0.95 |
| head | `clamp(2rem, 1.3rem + 2.6vw, 3.75rem)` | Franklin 700, tracking -0.03em, leading 1.0 |
| lead | `clamp(1.25rem, 1.1rem + 0.6vw, 1.625rem)` | Source Serif 400, leading 1.4 |
| body | `clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)` | Source Serif 400, leading 1.6 (doc pages 1.65), measure ≤ 68ch |
| small | `clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem)` | Franklin 500, sentence case |

Headlines: two lines or fewer at every width, sentence case, no styled accent word. Protocol identifiers are set in Franklin with
tabular figures (not monospace). Interface labels are sentence case; no tiny tracked capitals, no eyebrows above headings, no
01/02/03 numbering.

## Layout

- One 12-column grid, max width 1440px, page margins `clamp(20px, 3.3vw, 48px)`.
- **The axis**: column 6 starts at about 42% of the container. Section headings and body columns start on it; the zone to its
  left holds short side notes, figures or stays empty. On phones the axis collapses to the left margin and side notes move inline.
- Section gaps `clamp(96px, 12vw, 176px)`; gaps inside a section are always smaller.
- Neighbouring sections never share a composition, and none is a card grid. Text pages alternate with full-bleed colour pages
  (one cobalt field per page at most, the inverted night close at the end).
- Corners: square everywhere (buttons, images, fields). Buttons: one shape, 48px tall, flat cobalt with white text; secondary
  actions are text links.

## Surfaces and modes

| Surface | Mode | Shape |
| --- | --- | --- |
| Home | Persuade | masthead + dateline, intro tiles, the four principles as a staircase of statements, the Main Equation on a cobalt field, the nine layers as a table pushed right, projects as staggered tiles, inverted close |
| About, Projects, Converter info, Ayalon | Persuade / Read | same system, one figure page each |
| Protocols index | Read / operate | search and layer filter over a dated index table, grouped by layer, layer notes on the left of the axis |
| Protocol page | Read | left rail (this layer's protocols, on-this-page contents with the current section marked), article on the axis at ≤ 68ch, human title under the identifier, previous/next with titles |
| Survival Manual | Read | the protocol reading shell (`protocol-shell--doc`) |
| Converter tool | Operate | its own form layout on the shared tokens; RTL kept |

## Imagery

Order: generated illustrations (approved, two-colour risograph set in `website/tools/art-src/prompts.md`; the first attempt failed
because the OpenAI balance was exhausted, so none exist yet) → the project's own illustration, cropped clear of its baked-in
title and watermark, in one duotone treatment (ink → cobalt → pale) → drawings in code of the framework's own objects (the
equation, the layer stack, the opinion-to-rule dot field). One treatment for every raster. No stock, no Lady Justice as a motif.

## Motion

Intensity 3. One signature move: on the home masthead the headline lines rise from behind their own baseline (≈700ms, strong
ease-out, 90ms stagger). Section parts enter once as they reach the viewport (opacity and 16px rise, ≤ 500ms, 60ms stagger),
from an already-visible default: without script or with `prefers-reduced-motion` everything is simply there. Controls: hover in
≤ 150ms, press `scale(0.97)`, ease-out only, nothing over 300ms for interface feedback, nothing animates on every keystroke or
scroll tick except the contents marker. No libraries.

## Exceptions to the house rules (documentation conventions)

Real tables, form fields and the reading progress of a document keep their lines; real code keeps monospace; the protocol
contents list is a real `<ol>`/`<ul>`. The L0–L8 layer codes are part of the protocol identifiers, so they are shown wherever
layers are listed.
