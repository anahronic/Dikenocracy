"""Domain exceptions for converter_dti."""


class ConversionError(ValueError):
    """Base conversion error."""


class InvalidGregorianDateError(ConversionError):
    """Gregorian date is invalid."""


class InvalidDtiDateError(ConversionError):
    """DTI date is invalid."""


class InvalidHebrewDateError(ConversionError):
    """Hebrew date input is invalid."""


class UnsupportedYearError(ConversionError):
    """Year is unsupported for requested operation."""


class ConversionRangeError(ConversionError):
    """Date conversion is out of supported runtime range."""


class DtiEpochAnchorError(ConversionError):
    """JDN 0 is the DTI epoch anchor, not a dated day (author clarification 2026-11-18)."""


class BeforeDtiEpochError(ConversionError):
    """Days before the DTI epoch (JDN < 0) are not defined."""
