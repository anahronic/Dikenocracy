"""DTI conversion functions for DKP-0-TIME-001, with the author's clarified epoch and day numbering (2026-11-18).

JDN 0 is the epoch anchor of the count (not a dated day); JDN 1 is Year 1, Day 1; every DTI year has 360 days:
    DY = floor((JDN - 1) / 360) + 1,  DOY = ((JDN - 1) mod 360) + 1,  JDN = (DY - 1) * 360 + DOY.
The published protocol text (sections 5.1, 6.2, 9, 10) still states the earlier zero-based form; see PROTOCOL_NOTES.md.
"""

from __future__ import annotations

from converter_dti.domain.constants import DTI_DOY_MAX, DTI_DOY_MIN, DTI_EPOCH_JDN, DTI_YEAR_DAYS
from converter_dti.domain.errors import BeforeDtiEpochError, DtiEpochAnchorError, InvalidDtiDateError
from converter_dti.domain.models import DikenocraticDate, GregorianDate
from converter_dti.domain.gregorian import gregorian_to_jdn, jdn_to_gregorian


def validate_dti_date(dy: int, doy: int) -> None:
    """Validate DTI date.

    DY must be 1 or greater (no Year 0; days before the epoch are not defined). DOY must be in 1..360.
    """
    if not isinstance(dy, int) or dy < 1:
        raise InvalidDtiDateError("DY must be 1 or greater (Year 1 starts at JDN 1)")
    if not (DTI_DOY_MIN <= doy <= DTI_DOY_MAX):
        raise InvalidDtiDateError("DOY must be in 1..360")


def jdn_to_dti(jdn: int) -> DikenocraticDate:
    """Convert authoritative JDN into derived DTI representation (JDN >= 1)."""
    if jdn == DTI_EPOCH_JDN:
        raise DtiEpochAnchorError("JDN 0 is the DTI epoch anchor, not a dated day")
    if jdn < DTI_EPOCH_JDN:
        raise BeforeDtiEpochError("Days before the DTI epoch (JDN 0) are not defined")
    k = jdn - 1
    return DikenocraticDate(dy=k // DTI_YEAR_DAYS + 1, doy=k % DTI_YEAR_DAYS + 1)


def dti_to_jdn(dy: int, doy: int) -> int:
    """Convert DTI date to authoritative JDN."""
    validate_dti_date(dy, doy)
    return (dy - 1) * DTI_YEAR_DAYS + doy


def gregorian_to_dti(year: int, month: int, day: int) -> DikenocraticDate:
    """Convert Gregorian date directly to DTI via JDN."""
    jdn = gregorian_to_jdn(year, month, day)
    return jdn_to_dti(jdn)


def dti_to_gregorian(dy: int, doy: int) -> GregorianDate:
    """Convert DTI date directly to Gregorian via JDN."""
    jdn = dti_to_jdn(dy, doy)
    return jdn_to_gregorian(jdn)
