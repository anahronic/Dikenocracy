# Converter DTI

Deterministic converter service for DKP-0-TIME-001.

## Purpose

This package isolates all DTI conversion logic from UI code and exposes it through a reusable domain layer and FastAPI server.

Rules implemented (author's clarified DTI convention, 2026-11-18):
- DTI-Day = JDN (authoritative); JDN 0 is the epoch anchor of the count, not a dated day
- JDN 1 is Year 1, Day 1 (`DY1-001`); a DTI year has exactly 360 days numbered from 1
- `DY = floor((JDN - 1) / 360) + 1`, `DOY = ((JDN - 1) mod 360) + 1`; inverse `JDN = (DY - 1) * 360 + DOY`
- Canonical: `DY<dy>-<doy:03d>`; DY below 1 and DOY outside `1..360` are rejected; days before the epoch are not defined
- No leap/religious anchoring in DTI logic

## Conflict with the published protocol text

The published DKP-0-TIME-001 (sections 5.1, 6.2, 9, 10) states the earlier zero-based form `DY = floor(JDN / 360)`,
`DOY = (JDN mod 360) + 1`, under which JDN 1 would be `DY0-002`. The author clarified on 2026-11-18 that JDN 0 is the
anchor and JDN 1 is Year 1 Day 1; this implementation follows the clarification. Example: 2000-01-01 (JDN 2451545) is
`DY6810-305` (published formula: `DY6809-306`; published table: `DY6815-026`, matching neither). The protocol text is
unchanged until the author approves an erratum.

See `PROTOCOL_NOTES.md` for the same clarification in short form.

## Architecture

```text
Converter DTI/
  converter_dti/
    domain/   # deterministic engine (no UI dependencies)
    api/      # FastAPI layer, calls service only
    ui/       # optional Streamlit client, thin layer
    tests/    # protocol vectors, roundtrips, API tests
```

## Install

```bash
cd "Converter DTI"
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run API

```bash
cd "Converter DTI"
uvicorn converter_dti.api.main:app --reload --port 8000
```

## Run UI

```bash
cd "Converter DTI"
streamlit run converter_dti/ui/streamlit_app.py
```

## Run tests

```bash
cd "Converter DTI"
pytest -q
```

## API examples

### GET /health

```json
{"status":"ok","service":"converter-dti"}
```

### POST /convert/gregorian-to-dti

Request:

```json
{"year":2026,"month":1,"day":2}
```

Response:

```json
{
  "input": {"year": 2026, "month": 1, "day": 2},
  "jdn": 2461043,
  "dti": {"epoch": false, "dy": 6837, "doy": 83, "canonical": "DY6837-083"}
}
```

### POST /convert/dti-to-gregorian

Request:

```json
{"dy":6836,"doy":84}
```

Response:

```json
{
  "input": {"dy": 6836, "doy": 84},
  "jdn": 2461043,
  "gregorian": {"year": 2026, "month": 1, "day": 2, "iso": "2026-01-02"}
}
```
