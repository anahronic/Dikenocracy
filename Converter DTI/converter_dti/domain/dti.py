"""DTI conversion functions for DKP-0-TIME-001."""

from __future__ import annotations

from converter_dti.domain.constants import DTI_DOY_MAX, DTI_DOY_MIN, DTI_YEAR_DAYS
from converter_dti.domain.errors import InvalidDtiDateError
from converter_dti.domain.models import DikenocraticDate, GregorianDate
from converter_dti.domain.gregorian import gregorian_to_jdn, jdn_to_gregorian


def validate_dti_date(dy: int, doy: int) -> None:
    """Validate DTI date.

    DOY must be in 1..360. Negative DY is allowed.
    """
    if not (DTI_DOY_MIN <= doy <= DTI_DOY_MAX):
        raise InvalidDtiDateError("DOY must be in 1..360")


def jdn_to_dti(jdn: int) -> DikenocraticDate:
    """Convert authoritative JDN into derived DTI representation."""
    dy = jdn // DTI_YEAR_DAYS
    doy = (jdn % DTI_YEAR_DAYS) + 1
    return DikenocraticDate(dy=dy, doy=doy)


def dti_to_jdn(dy: int, doy: int) -> int:
    """Convert DTI date to authoritative JDN."""
    validate_dti_date(dy, doy)
    return dy * DTI_YEAR_DAYS + (doy - 1)


def gregorian_to_dti(year: int, month: int, day: int) -> DikenocraticDate:
    """Convert Gregorian date directly to DTI via JDN."""
    jdn = gregorian_to_jdn(year, month, day)
    return jdn_to_dti(jdn)


def dti_to_gregorian(dy: int, doy: int) -> GregorianDate:
    """Convert DTI date directly to Gregorian via JDN."""
    jdn = dti_to_jdn(dy, doy)
    return jdn_to_gregorian(jdn)
