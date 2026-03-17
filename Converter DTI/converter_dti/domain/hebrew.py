"""Hebrew parsing and conversion, isolated from UI."""

from __future__ import annotations

from datetime import date

from pyluach import dates
from pyluach.dates import gematria

from converter_dti.domain.errors import ConversionRangeError, InvalidHebrewDateError
from converter_dti.domain.gregorian import gregorian_to_jdn, jdn_to_gregorian
from converter_dti.domain.dti import jdn_to_dti
from converter_dti.domain.models import DikenocraticDate, GregorianDate

LETTER_TO_VALUE = {v: k for k, v in gematria._GEMATRIOS.items()}


def _parse_hebrew_letters(text: str) -> int:
    s_clean = text.replace('״', '').replace('׳', '').strip()
    if not s_clean:
        raise InvalidHebrewDateError("Empty Hebrew letters input")
    value = 0
    for char in s_clean:
        if char not in LETTER_TO_VALUE:
            raise InvalidHebrewDateError(f"Invalid Hebrew letter: {char}")
        value += LETTER_TO_VALUE[char]
    return value


def parse_hebrew_year_text(text: str) -> int:
    """Parse Hebrew year text (numeric or Hebrew letters)."""
    txt = text.strip()
    if txt.isdigit():
        return int(txt)
    return _parse_hebrew_letters(txt) + 5000


def parse_hebrew_day_text(text: str) -> int:
    """Parse Hebrew day text (numeric or Hebrew letters)."""
    txt = text.strip()
    if txt.isdigit():
        day = int(txt)
    else:
        day = _parse_hebrew_letters(txt)
    if not (1 <= day <= 31):
        raise InvalidHebrewDateError("Hebrew day must be in 1..31")
    return day


def hebrew_to_gregorian(year: int, month: int, day: int) -> GregorianDate:
    """Convert Hebrew date to Gregorian date."""
    try:
        h_obj = dates.HebrewDate(year, month, day)
        py_d = h_obj.to_pydate()
    except Exception as exc:
        raise InvalidHebrewDateError(str(exc)) from exc
    return GregorianDate(year=py_d.year, month=py_d.month, day=py_d.day)


def gregorian_to_hebrew(year: int, month: int, day: int) -> tuple[int, int, int, str]:
    """Convert Gregorian date to Hebrew date numeric + string."""
    if year <= 0:
        raise ConversionRangeError("Gregorian year <= 0 cannot be converted to pyluach date")
    try:
        h_obj = dates.HebrewDate.from_pydate(date(year, month, day))
    except Exception as exc:
        raise InvalidHebrewDateError(str(exc)) from exc
    return h_obj.year, h_obj.month, h_obj.day, h_obj.hebrew_date_string()


def hebrew_to_dti(year: int, month: int, day: int) -> DikenocraticDate:
    """Convert Hebrew date to DTI."""
    g = hebrew_to_gregorian(year, month, day)
    jdn = gregorian_to_jdn(g.year, g.month, g.day)
    return jdn_to_dti(jdn)


def dti_to_hebrew(dy: int, doy: int) -> tuple[int, int, int, str]:
    """Convert DTI to Hebrew date via Gregorian."""
    from converter_dti.domain.dti import dti_to_jdn

    jdn = dti_to_jdn(dy, doy)
    g = jdn_to_gregorian(jdn)
    return gregorian_to_hebrew(g.year, g.month, g.day)
