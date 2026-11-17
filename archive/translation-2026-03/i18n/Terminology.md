# DKP Translation Terminology Governance

> Version: 1.0
> Status: Active
> Authority: `/website/i18n/dkp_terms.json`

---

## 1. Purpose

This document defines the rules governing all multilingual translations of Dikenocracy Protocol (DKP) pages.

Translation of DKP protocols is NOT localization. It is **controlled protocol translation** — the preservation of deterministic protocol meaning in target languages.

---

## 2. Governing Principles

### 2.1 One Term — One Translation

Each English source term has exactly **one** approved translation per target language.

- No synonyms.
- No interchangeable variants.
- No "better sounding" alternates.
- No style-based substitutions.

If "enforcement" is translated as "Принуждение" in Russian, then "Принуждение" is used in every protocol, every section, every context. No exceptions.

### 2.2 Terminology Authority

The single source of truth for all DKP terminology is:

```
/website/i18n/dkp_terms.json
```

No translation may use a term that contradicts this file.

### 2.3 No Free Translation

Translation MUST preserve:

- **Normative force** — "MUST" stays mandatory; "MAY" stays optional; "SHALL NOT" stays prohibited.
- **Logical conditions** — if/unless/only if/absent must remain logically precise.
- **Prohibition scope** — "forbidden" stays forbidden; never weaken to "not recommended."
- **Dependency structure** — protocol references remain exact.
- **System-layer semantics** — layer names, protocol identifiers unchanged.
- **Cross-protocol references** — kept clickable and exact.
- **Architectural boundaries** — no rewriting logic into explanatory prose.

---

## 3. Modal Verb Rules

| English Source | Force Level | Translation Rule |
|---|---|---|
| MUST | Mandatory obligation | Must remain mandatory in all languages |
| MUST NOT | Absolute prohibition | Must remain absolute prohibition |
| SHALL | Normative requirement | Must remain normative requirement |
| SHALL NOT | Normative prohibition | Must remain normative prohibition |
| MAY | Optional permission | Must remain optional permission |
| MAY NOT | Conditional prohibition | Must remain conditional prohibition |
| SHOULD | Recommendation | Must remain recommendation (not obligation) |
| SHOULD NOT | Negative recommendation | Must remain negative recommendation |
| forbidden | Absolute ban | Must remain absolute ban |
| required | Mandatory state | Must remain mandatory |

### Modal Verb Translations

| EN | RU | HE | AR | ZH | ES | FR | DE | IT | PT |
|---|---|---|---|---|---|---|---|---|---|
| MUST | ДОЛЖЕН | חייב | يجب | 必须 | DEBE | DOIT | MUSS | DEVE | DEVE |
| MUST NOT | НЕ ДОЛЖЕН | אסור | يجب ألا | 不得 | NO DEBE | NE DOIT PAS | DARF NICHT | NON DEVE | NÃO DEVE |
| SHALL | ОБЯЗАН | יהיה | يتعين | 应当 | DEBERÁ | DEVRA | SOLL | DOVRÀ | DEVERÁ |
| SHALL NOT | НЕ ВПРАВЕ | לא יהיה | لا يجوز | 不应 | NO DEBERÁ | NE DEVRA PAS | SOLL NICHT | NON DOVRÀ | NÃO DEVERÁ |
| MAY | МОЖЕТ | רשאי | يجوز | 可以 | PODRÁ | PEUT | DARF | PUÒ | PODE |
| MAY NOT | НЕ МОЖЕТ | אינו רשאי | لا يجوز | 不可 | NO PODRÁ | NE PEUT PAS | DARF NICHT | NON PUÒ | NÃO PODE |
| forbidden | запрещено | אסור | محظور | 禁止 | prohibido | interdit | verboten | vietato | proibido |
| required | обязательно | נדרש | مطلوب | 必需 | requerido | requis | erforderlich | richiesto | obrigatório |

---

## 4. Protocol Identifiers

Protocol identifiers are **NEVER** translated. They remain in their exact English form:

- DKP-1-AXIOMS-001
- DKP-0-ORACLE-001
- DKP-7-SCOPE-001
- DKP-6-RESILIENCE-001

This applies to:
- Page titles
- Cross-protocol references
- Navigation labels
- Metadata blocks
- Sidebar map entries

---

## 5. Untranslatable Elements

The following elements remain in English regardless of target language:

- Protocol identifiers (DKP-X-NAME-NNN)
- SHA-256 hash references
- Mathematical notation (δίκη, S(t), Iᵢ, Rᵢ, Xᵢ, Uᵢ, B(t))
- Variable names (N_eff, TTL)
- Greek letters used as formal symbols
- Code-like expressions
- URL paths and href values

---

## 6. Structural Preservation Rules

1. **Section numbering** — must remain identical (1., 2., 3.1, 3.2, etc.)
2. **Heading hierarchy** — h1/h2/h3/h4 levels unchanged
3. **List structure** — enumerated clauses stay enumerated; bullet points stay bullets
4. **Table structure** — rows, columns, ordering unchanged
5. **Metadata blocks** — Version, Status fields in same position
6. **Navigation** — Previous/Next links work identically
7. **Protocol Map** — structure identical, names unchanged

---

## 7. Language-Specific Rules

### 7.1 Russian (RU)
- Formal technical register
- No colloquialisms
- No journalistic style
- No ornamental wording
- Use standard technical/legal Russian

### 7.2 English (EN)
- Source language — preserve original wording
- Normalize only if strictly needed for consistency
- Do not "improve" source text

### 7.3 Hebrew (HE)
- Modern formal Hebrew (legal/technical)
- Avoid biblical or literary tone
- RTL layout required
- Preserve precision over style

### 7.4 Arabic (AR)
- Modern Standard Arabic (فصحى)
- No regional colloquialisms
- RTL layout required
- Maintain legal/technical clarity

### 7.5 Chinese (ZH)
- Formal modern written Chinese
- Concise but not oversimplified
- Preserve protocol tone and force
- Use standard technical terminology

### 7.6 Spanish (ES)
- Formal neutral international Spanish
- No country-specific slang
- Specification style throughout

### 7.7 French (FR)
- Administrative-technical register
- Preserve regulatory force
- No conversational phrasing

### 7.8 German (DE)
- Legal-technical register
- Maintain precision and structured logic
- Compound terms acceptable where standard

### 7.9 Italian (IT)
- Administrative-technical register
- No loose paraphrase
- Preserve normative structure

### 7.10 Portuguese (PT)
- Formal neutral Portuguese
- Avoid exclusively Brazilian or European phrasing
- Specification tone throughout

---

## 8. Hard Stop Conditions

Translation MUST STOP and flag for review if:

1. A DKP term has no stable equivalent in the target language
2. A source sentence allows two materially different interpretations
3. The target language requires forced simplification that changes logic
4. A cross-protocol reference becomes ambiguous in translation
5. A modal verb has no clear force-equivalent in the target language

In these cases: **do not guess**. Mark the passage with `[REVIEW REQUIRED]` and document the ambiguity.

---

## 9. Forbidden Practices

- Summarizing protocol sections
- Compressing repeated legal constraints
- Removing "redundant" phrases
- Merging clauses
- Adding interpretation
- Explaining the protocol inside the translation
- Turning rules into softer prose
- Normalizing away repetition that carries legal force
- Using different translations for the same DKP term across pages

---

## 10. Validation Checklist

For every translated protocol page, verify:

| # | Check | Pass? |
|---|---|---|
| 1 | Protocol identifier unchanged | |
| 2 | Section numbering unchanged | |
| 3 | All metadata preserved | |
| 4 | All normative operators preserved (MUST/SHALL/MAY) | |
| 5 | No missing clauses | |
| 6 | No extra clauses | |
| 7 | All cross-protocol references preserved | |
| 8 | Terminology matches `dkp_terms.json` exactly | |
| 9 | Visual structure matches source page | |
| 10 | Navigation works | |
| 11 | Language switcher works | |
| 12 | RTL correct (HE/AR) | |
| 13 | No inline CSS | |
| 14 | No machine-translation artifacts | |

---

## 11. Revision History

| Date | Version | Change |
|---|---|---|
| 2026-03-30 | 1.0 | Initial terminology governance document |
