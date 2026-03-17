"""Formatting helpers for deterministic outputs."""

from __future__ import annotations

from converter_dti.domain.models import DikenocraticDate, GregorianDate


def format_dti_canonical(dd: DikenocraticDate) -> str:
    """Return canonical DTI string: DY<dy>-<doy:03d>."""
    return f"DY{dd.dy}-{dd.doy:03d}"


def format_gregorian_localized(gd: GregorianDate, lang: str = "EN") -> str:
    """Format Gregorian date with BC labels for year <= 0."""
    suffixes = {
        "EN": "BC",
        "RU": "до н.э.",
        "HE": "לפנה״ס",
    }
    if gd.year <= 0:
        suffix = suffixes.get(lang, "BC")
        display_year = abs(gd.year)
        return f"{display_year} {suffix}-{gd.month:02d}-{gd.day:02d}"
    return f"{gd.year:04d}-{gd.month:02d}-{gd.day:02d}"


def format_iso_gregorian(gd: GregorianDate) -> str:
    """Return ISO string for positive years, BC label for non-positive years."""
    if gd.year <= 0:
        return format_gregorian_localized(gd, lang="EN")
    return f"{gd.year:04d}-{gd.month:02d}-{gd.day:02d}"
