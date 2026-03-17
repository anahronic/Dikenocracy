"""Service layer composing deterministic domain conversions."""

from __future__ import annotations

from converter_dti.domain.dti import dti_to_gregorian, dti_to_jdn, gregorian_to_dti, jdn_to_dti
from converter_dti.domain.formatting import format_dti_canonical, format_iso_gregorian
from converter_dti.domain.gregorian import gregorian_to_jdn, jdn_to_gregorian
from converter_dti.domain.hebrew import (
    dti_to_hebrew,
    gregorian_to_hebrew,
    hebrew_to_dti,
    hebrew_to_gregorian,
    parse_hebrew_day_text,
    parse_hebrew_year_text,
)


def convert_gregorian_to_dti(year: int, month: int, day: int) -> dict:
    """Convert Gregorian to JDN + DTI."""
    jdn = gregorian_to_jdn(year, month, day)
    dti = jdn_to_dti(jdn)
    return {
        "input": {"year": year, "month": month, "day": day},
        "jdn": jdn,
        "dti": {
            "dy": dti.dy,
            "doy": dti.doy,
            "canonical": format_dti_canonical(dti),
        },
    }


def convert_dti_to_gregorian(dy: int, doy: int) -> dict:
    """Convert DTI to JDN + Gregorian."""
    jdn = dti_to_jdn(dy, doy)
    greg = jdn_to_gregorian(jdn)
    return {
        "input": {"dy": dy, "doy": doy},
        "jdn": jdn,
        "gregorian": {
            "year": greg.year,
            "month": greg.month,
            "day": greg.day,
            "iso": format_iso_gregorian(greg),
        },
    }


def convert_gregorian_to_hebrew(year: int, month: int, day: int) -> dict:
    """Convert Gregorian to Hebrew representation."""
    hy, hm, hd, htxt = gregorian_to_hebrew(year, month, day)
    return {
        "input": {"year": year, "month": month, "day": day},
        "hebrew": {
            "year": hy,
            "month": hm,
            "day": hd,
            "text": htxt,
        },
    }


def convert_hebrew_to_gregorian(year: int, month: int, day: int) -> dict:
    """Convert Hebrew to Gregorian representation."""
    greg = hebrew_to_gregorian(year, month, day)
    return {
        "input": {"year": year, "month": month, "day": day},
        "gregorian": {
            "year": greg.year,
            "month": greg.month,
            "day": greg.day,
            "iso": format_iso_gregorian(greg),
        },
    }


def convert_gregorian_full(year: int, month: int, day: int) -> dict:
    """Return Gregorian, JDN, DTI, Hebrew."""
    jdn = gregorian_to_jdn(year, month, day)
    dti = jdn_to_dti(jdn)
    hy, hm, hd, htxt = gregorian_to_hebrew(year, month, day)
    return {
        "gregorian": {
            "year": year,
            "month": month,
            "day": day,
            "iso": format_iso_gregorian(jdn_to_gregorian(jdn)),
        },
        "jdn": jdn,
        "dti": {"dy": dti.dy, "doy": dti.doy, "canonical": format_dti_canonical(dti)},
        "hebrew": {"year": hy, "month": hm, "day": hd, "text": htxt},
    }


def convert_dti_full(dy: int, doy: int) -> dict:
    """Return Gregorian, JDN, DTI, Hebrew from DTI input."""
    jdn = dti_to_jdn(dy, doy)
    greg = dti_to_gregorian(dy, doy)
    hy, hm, hd, htxt = dti_to_hebrew(dy, doy)
    dti = jdn_to_dti(jdn)
    return {
        "gregorian": {
            "year": greg.year,
            "month": greg.month,
            "day": greg.day,
            "iso": format_iso_gregorian(greg),
        },
        "jdn": jdn,
        "dti": {"dy": dti.dy, "doy": dti.doy, "canonical": format_dti_canonical(dti)},
        "hebrew": {"year": hy, "month": hm, "day": hd, "text": htxt},
    }


def convert_hebrew_full(year: int, month: int, day: int) -> dict:
    """Return Gregorian, JDN, DTI, Hebrew from Hebrew input."""
    greg = hebrew_to_gregorian(year, month, day)
    jdn = gregorian_to_jdn(greg.year, greg.month, greg.day)
    dti = hebrew_to_dti(year, month, day)
    hy, hm, hd, htxt = gregorian_to_hebrew(greg.year, greg.month, greg.day)
    return {
        "gregorian": {
            "year": greg.year,
            "month": greg.month,
            "day": greg.day,
            "iso": format_iso_gregorian(greg),
        },
        "jdn": jdn,
        "dti": {"dy": dti.dy, "doy": dti.doy, "canonical": format_dti_canonical(dti)},
        "hebrew": {"year": hy, "month": hm, "day": hd, "text": htxt},
    }


def parse_hebrew_text_to_parts(year_text: str, month: int, day_text: str) -> tuple[int, int, int]:
    """Parse Hebrew textual year/day into numeric date parts."""
    return parse_hebrew_year_text(year_text), month, parse_hebrew_day_text(day_text)
