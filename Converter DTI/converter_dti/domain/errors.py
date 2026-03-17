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
