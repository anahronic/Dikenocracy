# Converter DTI

Deterministic converter service for DKP-0-TIME-001.

## Purpose

This package isolates all DTI conversion logic from UI code and exposes it through a reusable domain layer and FastAPI server.

Core protocol rules implemented:
- DTI-Day = JDN (authoritative)
- DTI year = exactly 360 days
- `DY = floor(JDN / 360)`
- `DOY = (JDN mod 360) + 1`
- Canonical: `DY<dy>-<doy:03d>`
- DOY outside `1..360` is rejected
- No leap/religious anchoring in DTI logic

## Protocol inconsistency note

For `2000-01-01`, canonical formula output is:
- `JDN = 2451545`
- `DY = floor(2451545 / 360) = 6809`
- `DOY = (2451545 mod 360) + 1 = 306`
- Canonical DTI: `DY6809-306`

An older table value `DY6815-026` conflicts with the canonical formula above and is not adopted by this implementation.

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
  "dti": {"dy": 6836, "doy": 84, "canonical": "DY6836-084"}
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
