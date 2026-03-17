"""Deterministic Gregorian/JDN conversions for DKP-0-TIME-001."""

from __future__ import annotations

from datetime import date

from converter_dti.domain.errors import InvalidGregorianDateError
from converter_dti.domain.models import GregorianDate


def validate_gregorian_date(year: int, month: int, day: int) -> None:
    """Validate Gregorian date with protocol constraints.

    Year 0 is forbidden.
    """
    if year == 0:
        raise InvalidGregorianDateError("Year 0 is not allowed")
    if not (1 <= month <= 12):
        raise InvalidGregorianDateError("Month must be in 1..12")
    if year > 0:
        try:
            date(year, month, day)
        except ValueError as exc:
            raise InvalidGregorianDateError(str(exc)) from exc
    else:
        if not (1 <= day <= 31):
            raise InvalidGregorianDateError("Day must be in 1..31 for BC input")


def gregorian_to_jdn(year: int, month: int, day: int) -> int:
    """Convert Gregorian date to JDN deterministically.

    Uses astronomical year conversion for BC years:
    historical year -1 (1 BC) maps to astronomical year 0.
    """
    validate_gregorian_date(year, month, day)

    y = year
    if y < 0:
        y += 1
    a = (14 - month) // 12
    y2 = y + 4800 - a
    m2 = month + 12 * a - 3
    return day + (153 * m2 + 2) // 5 + 365 * y2 + y2 // 4 - y2 // 100 + y2 // 400 - 32045


def jdn_to_gregorian(jdn: int) -> GregorianDate:
    """Convert JDN to Gregorian date deterministically."""
    a = jdn + 32044
    b = (4 * a + 3) // 146097
    c = a - (146097 * b) // 4
    d = (4 * c + 3) // 1461
    e = c - (1461 * d) // 4
    m = (5 * e + 2) // 153
    day = e - (153 * m + 2) // 5 + 1
    month = m + 3 - 12 * (m // 10)
    year = 100 * b + d - 4800 + (m // 10)

    if year <= 0:
        year -= 1
    return GregorianDate(year=year, month=month, day=day)
