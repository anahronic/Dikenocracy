"""Pydantic schemas for API endpoints."""

from pydantic import BaseModel, Field


class GregorianInput(BaseModel):
    year: int
    month: int = Field(ge=1, le=12)
    day: int = Field(ge=1, le=31)


class DtiInput(BaseModel):
    dy: int
    doy: int = Field(ge=1, le=360)


class HebrewInput(BaseModel):
    year: int
    month: int = Field(ge=1, le=13)
    day: int = Field(ge=1, le=31)


class HebrewTextInput(BaseModel):
    year_text: str
    month: int = Field(ge=1, le=13)
    day_text: str
