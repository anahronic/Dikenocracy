"""Typed domain models."""

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class GregorianDate:
    """Proleptic Gregorian date (year 0 forbidden by protocol)."""

    year: int
    month: int
    day: int


@dataclass(frozen=True)
class DikenocraticDate:
    """DKP-0-TIME-001 DTI date."""

    dy: int
    doy: int


@dataclass(frozen=True)
class HebrewDateInput:
    """Hebrew date input in numeric values."""

    year: int
    month: int
    day: int


@dataclass(frozen=True)
class ConversionResult:
    """Unified conversion result for full endpoints."""

    gregorian: GregorianDate
    jdn: int
    dti: DikenocraticDate
    hebrew_numeric: tuple[int, int, int]
    hebrew_text: str


@dataclass(frozen=True)
class ErrorResponse:
    """Structured error response."""

    code: str
    message: str
    detail: Optional[dict] = None
