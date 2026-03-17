"""Conversion endpoints."""

from fastapi import APIRouter, HTTPException

from converter_dti.domain.errors import ConversionError
from converter_dti.domain.service import (
    convert_dti_full,
    convert_dti_to_gregorian,
    convert_gregorian_full,
    convert_gregorian_to_dti,
    convert_gregorian_to_hebrew,
    convert_hebrew_full,
    convert_hebrew_to_gregorian,
)
from converter_dti.api.schemas import DtiInput, GregorianInput, HebrewInput

router = APIRouter(prefix="/convert", tags=["convert"])


def _wrap(callable_fn, payload):
    try:
        return callable_fn(**payload.model_dump())
    except ConversionError as exc:
        raise HTTPException(status_code=400, detail={"code": exc.__class__.__name__, "message": str(exc)}) from exc


@router.post("/gregorian-to-dti")
def gregorian_to_dti(body: GregorianInput) -> dict:
    """Convert Gregorian date into JDN and DTI."""
    return _wrap(convert_gregorian_to_dti, body)


@router.post("/dti-to-gregorian")
def dti_to_gregorian(body: DtiInput) -> dict:
    """Convert DTI date into JDN and Gregorian."""
    return _wrap(convert_dti_to_gregorian, body)


@router.post("/gregorian-to-hebrew")
def gregorian_to_hebrew(body: GregorianInput) -> dict:
    """Convert Gregorian date to Hebrew date."""
    return _wrap(convert_gregorian_to_hebrew, body)


@router.post("/hebrew-to-gregorian")
def hebrew_to_gregorian(body: HebrewInput) -> dict:
    """Convert Hebrew date to Gregorian date."""
    return _wrap(convert_hebrew_to_gregorian, body)


@router.post("/gregorian-full")
def gregorian_full(body: GregorianInput) -> dict:
    """Return full conversion bundle from Gregorian."""
    return _wrap(convert_gregorian_full, body)


@router.post("/dti-full")
def dti_full(body: DtiInput) -> dict:
    """Return full conversion bundle from DTI."""
    return _wrap(convert_dti_full, body)


@router.post("/hebrew-full")
def hebrew_full(body: HebrewInput) -> dict:
    """Return full conversion bundle from Hebrew date."""
    return _wrap(convert_hebrew_full, body)
