# DKP Protocol Translation Roadmap

> Version: 1.0
> Date: 2026-03-30
> Status: Active

---

## 1. Architecture Decision

**Chosen approach:** Query parameter rendering from a single HTML source.

```
/pages/protocols/dkp-1-axioms-001.html?lang=ru
/pages/protocols/dkp-1-axioms-001.html?lang=he
/pages/protocols/dkp-1-axioms-001.html?lang=zh
```

**Rationale:**
- Single HTML file per protocol — one structural source of truth
- Translations stored as JSON data files in `/website/i18n/protocols/`
- JavaScript i18n loader reads `?lang=XX` and applies translations to the DOM
- No file duplication; structural changes propagate automatically
- Default language: EN (no parameter or `?lang=en`)

**File layout:**
```
/website/
├── i18n/
│   ├── dkp_terms.json              # Master terminology dictionary
│   ├── Terminology.md              # Translation governance rules
│   ├── ui_labels.json              # Shared UI string translations
│   └── protocols/                  # Per-protocol translation files
│       ├── dkp-0-oracle-001.json
│       ├── dkp-0-time-001.json
│       ├── dkp-1-axioms-001.json
│       ├── dkp-1-identity-001.json
│       ├── dkp-1-impact-001.json
│       ├── dkp-1-justice-001.json
│       ├── dkp-1-prevention-001.json
│       ├── dkp-2-assets-001.json
│       ├── dkp-2-finance-001.json
│       ├── dkp-2-labor-001.json
│       ├── dkp-3-antiterror-001.json
│       ├── dkp-3-defense-001.json
│       ├── dkp-3-internal-sec-001.json
│       ├── dkp-3-police-001.json
│       ├── dkp-4-crisis-001.json
│       ├── dkp-4-error-001.json
│       ├── dkp-4-upgrade-001.json
│       ├── dkp-5-culture-001.json
│       ├── dkp-5-edu-001.json
│       ├── dkp-5-habitat-001.json
│       ├── dkp-5-info-001.json
│       ├── dkp-5-transport-001.json
│       ├── dkp-5-work-cycle-001.json
│       ├── dkp-6-exit-001.json
│       ├── dkp-6-integration-001.json
│       ├── dkp-6-resilience-001.json
│       ├── dkp-7-ai-subject-001.json
│       ├── dkp-7-privacy-001.json
│       ├── dkp-7-scope-001.json
│       ├── dkp-7-transparency-001.json
│       ├── dkp-8-audit-001.json
│       ├── dkp-8-interop-001.json
│       ├── dkp-8-simulation-001.json
│       ├── code-of-planetary-synergy.json
│       └── appendix-a-design-rationale-safeguards-normative.json
├── i18n.js                         # i18n loader script
├── docs/
│   └── Translation_Roadmap.md      # This document
└── pages/protocols/                # Existing HTML pages (unchanged structure)
```

---

## 2. Supported Languages

| Code | Language | Direction | Register |
|---|---|---|---|
| EN | English | LTR | Source language |
| RU | Russian | LTR | Formal technical |
| HE | Hebrew | RTL | Legal-technical |
| AR | Arabic | RTL | Modern Standard Arabic |
| ZH | Chinese | LTR | Formal written |
| ES | Spanish | LTR | Formal international |
| FR | French | LTR | Administrative-technical |
| DE | German | LTR | Legal-technical |
| IT | Italian | LTR | Administrative-technical |
| PT | Portuguese | LTR | Formal neutral |

---

## 3. Translation Data Format

### 3.1 UI Labels (`ui_labels.json`)
```json
{
  "back_to_protocols": {
    "en": "← All Protocols",
    "ru": "← Все протоколы",
    "he": "← כל הפרוטוקולים",
    ...
  }
}
```

### 3.2 Protocol Translation (`i18n/protocols/<name>.json`)

Each protocol file maps translatable content by section ID:

```json
{
  "protocol_id": "DKP-1-AXIOMS-001",
  "translations": {
    "ru": {
      "subtitle": "Протокол аксиом",
      "sections": {
        "1-purpose": {
          "heading": "1. Назначение",
          "content": ["<p>Протокол аксиом определяет...</p>"]
        }
      }
    }
  }
}
```

Content is stored as an array of HTML strings per section, preserving exact structure.

---

## 4. Execution Phases

### Phase A — Preparation ✅
- [x] Inventory all 35 protocol HTML pages
- [x] Inventory shared UI labels
- [x] Inventory protocol metadata labels
- [x] Extract terminology from all protocols

### Phase B — Terminology ✅
- [x] Create `dkp_terms.json` (90+ controlled terms × 10 languages)
- [x] Create `Terminology.md` governance document
- [x] Modal verb translation table for all 10 languages

### Phase C — Translation Infrastructure
- [x] Implement i18n architecture (`i18n.js` loader)
- [x] Implement language switcher component
- [x] Implement RTL support for HE and AR
- [x] Create `ui_labels.json` with all shared strings
- [x] Add `data-i18n` attributes to protocol HTML pages

### Phase D — Controlled Translation
- [x] Translate all shared UI labels (10 languages)
- [x] Translate protocol metadata labels (10 languages)
- [x] Translate pilot protocol: DKP-1-AXIOMS-001
- [ ] Translate remaining protocols (batch processing)

### Phase E — Validation
- [x] Structure validation (section IDs, heading hierarchy)
- [x] Terminology validation (cross-reference with dkp_terms.json)
- [ ] Visual validation per language
- [ ] RTL validation (HE, AR)
- [ ] Full navigation test

---

## 5. Protocol Translation Priority

### Tier 1 — Core (translate first)
1. DKP-1-AXIOMS-001
2. DKP-1-IDENTITY-001
3. DKP-1-IMPACT-001
4. DKP-1-JUSTICE-001
5. DKP-1-PREVENTION-001

### Tier 2 — Foundation + Stability
6. DKP-0-ORACLE-001
7. DKP-0-TIME-001
8. DKP-4-CRISIS-001
9. DKP-4-ERROR-001
10. DKP-4-UPGRADE-001

### Tier 3 — Economic + Security
11. DKP-2-ASSETS-001
12. DKP-2-FINANCE-001
13. DKP-2-LABOR-001
14. DKP-3-DEFENSE-001
15. DKP-3-ANTITERROR-001
16. DKP-3-INTERNAL-SEC-001
17. DKP-3-POLICE-001

### Tier 4 — Human Infrastructure
18. DKP-5-CULTURE-001
19. DKP-5-EDU-001
20. DKP-5-HABITAT-001
21. DKP-5-INFO-001
22. DKP-5-TRANSPORT-001
23. DKP-5-WORK-CYCLE-001

### Tier 5 — Intersystem + Meta + Infrastructure
24. DKP-6-EXIT-001
25. DKP-6-INTEGRATION-001
26. DKP-6-RESILIENCE-001
27. DKP-7-AI-SUBJECT-001
28. DKP-7-PRIVACY-001
29. DKP-7-SCOPE-001
30. DKP-7-TRANSPARENCY-001
31. DKP-8-AUDIT-001
32. DKP-8-INTEROP-001
33. DKP-8-SIMULATION-001

### Tier 6 — Foundational Documents
34. Code of Planetary Synergy
35. Appendix A

---

## 6. Deployment Plan

1. All translations committed to `/website/i18n/protocols/`
2. `i18n.js` and `ui_labels.json` deployed alongside protocol pages
3. CSS RTL rules added to `styles.css`
4. Language switcher added to protocol page template
5. Production deployment via SCP to `admin@37.27.244.96:/var/www/html/`
6. Verification of all live URLs with `?lang=XX` parameter

---

## 7. Maintenance

- New protocols: create JSON translation file, add to translation queue
- Term changes: update `dkp_terms.json` first, then propagate to all protocol files
- New languages: add to `dkp_terms.json`, `ui_labels.json`, and all protocol files

---

## 8. Revision History

| Date | Version | Change |
|---|---|---|
| 2026-03-30 | 1.0 | Initial roadmap |
