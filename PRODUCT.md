# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: newcomers.** People who have heard the name Dikenocracy (from the author, a friend, a link) and want to understand in a minute what it is, why it exists and where to start reading. Confirmed by the owner on 2026-10-14: newcomers come first.
- **Secondary: technical readers.** Auditors, contributors and red-team reviewers who read the protocols in full, jump between related protocols, cite section anchors and download the complete text.
- **Tool users.** People who come for one working project: Mazkira (small businesses in Israel; Hebrew, Russian, English), the DTI Time Converter, Shadoo (local encryption), the Survival Manual.

## Product Purpose

dikenocracy.com is the public gateway to the Dikenocracy framework. It explains the idea in plain language, publishes the canonical texts (the Code of Planetary Synergy, 35 protocols in nine layers L0–L8, one addendum, one appendix) and links the working projects that put parts of the protocols into software. Success: a newcomer understands the idea on the first screen and finds a clear path from the idea to the detailed documentation; a technical reader reaches any protocol, section or related protocol in a couple of steps.

## Positioning

Justice as a function, not a metaphor: governance built on measurable reality, deterministic rules and transparent protocols, designed to reduce dependence on opinion, narrative and unchecked authority. Specific to this project and not copyable by a neighbour:
- the Code of Planetary Synergy and its Main Equation of Civilization Motion (Appendix A.1: `dW/dt ≥ k · E(t) · T(t) · B(t)^2.83`, with its stated variables);
- the nine-layer stack, where no higher-layer protocol may violate a lower-layer constraint;
- protocol identifiers `DKP-<layer>-<domain>-<seq>`, each document dated with its own "Last updated";
- the Dikenocratic Time Index (DKP-0-TIME-001: DTI dates such as `DY6837-008`, a 360-day year counted from the Julian Day Number);
- the name, from δίκη (Dike), justice as a measurable balance between a subject's actions and the system's stability.

## Operating Context

- Canonical sources are Markdown files in github.com/anahronic/World (`Dikenocracy/`). `website/build_release.py` generates the protocol pages, the protocol index, the manifest, sitemap entries and the consolidated TXT. Hand-written pages get the shared chrome from `website/tools/apply_chrome.py`.
- The site is static HTML/CSS/vanilla JS served by nginx from `/var/www/html` behind Cloudflare. No framework, no build step for the hand-written pages.
- Other surfaces on the same domain share the navigation and the stylesheet name: Survival Manual (`/survival/`, built by `E:\004 POST NUCLEAR SURVIVAL MANUAL\build_survival.py --site-root`), Shadoo (`/shadoo/`, patched build with its own skin), Mazkira (separate app at mazkira.dikenocracy.com).
- A Russian edition of the whole release exists offline (DOCX/FB2), not on the site.

## Capabilities and Constraints

- The protocol texts are authoritative and must not change through design work. Generated pages are changed only through the templates in `build_release.py`.
- URLs, heading anchors (including `ID_OVERRIDES`), canonical links, OG metadata and the sitemap must be preserved.
- Formula and index markup is copy-safe (`<sup>`/`<sub>` copy as `^`/`_`); `release/browser_check.cjs` checks it.
- The DTI Time Converter supports 10 interface languages, with right-to-left layout for Hebrew and Arabic.
- Ayalon Monitor is paused (its live model is offline; `/ayalon/` redirects to the project page).
- No new frameworks, dependencies or backend changes. No deployment without the owner's approval.

## Brand Commitments

- Name: Dikenocracy. Manifesto line: "We don’t ask the old world for permission. We build a new world alongside it." Footer note: "Dikenocracy — public framework. Built openly alongside the old world."
- Light site. Visitors called the earlier dark site depressing; the owner asked for a light site with pictures (2026-10-14).
- Must not look like a law office or a template. Feedback of 2026-10-14: "шаблонно", "адвокатская контора", "lots of content, no emphasis on anything".
- The scales emblem is retired as the logo in favour of a typographic wordmark (owner's decision, 2026-10-14). The scales stay only where they mean something (the L1 Core layer icon).

## Evidence on Hand

- Real content: all protocol texts, the Code and its Main Equation, the release date (2026-10-04), per-document "Last updated" dates, the layer descriptions, project descriptions, the complete-text TXT.
- Imagery: `website/tools/source/welcome_screen.webp` (the project's own illustration of Dike in a city; it has baked-in title text and a generator watermark, so it is only used cropped). New illustrations may be generated with the OpenAI image tool on the owner's key (approved 2026-10-14).
- Absent, never to be fabricated: testimonials, user or adoption numbers, press, partner logos, endorsements, licence terms not stated in the texts.

## Product Principles

1. Explain before specifying: every page offers the plain-language idea first and one step to the full text.
2. The canonical text is the authority; the site presents it and never paraphrases it into new claims.
3. Open and dated: every document shows its identifier and its last-updated date; sources are one click away.
4. Tools prove the protocols: each project says which part of the stack it puts into practice.

## Accessibility & Inclusion

Target WCAG 2.2 AA. Comfortable touch targets on phones (owner feedback 2026-10-14: navigation buttons must be large). Right-to-left support in the converter. Readable long-form text for multi-thousand-word protocols, with working keyboard navigation and visible focus.
