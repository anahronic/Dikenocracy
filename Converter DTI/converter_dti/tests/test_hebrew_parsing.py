import pytest

from converter_dti.domain.errors import InvalidHebrewDateError
from converter_dti.domain.hebrew import parse_hebrew_day_text, parse_hebrew_year_text


def test_parse_hebrew_numeric_year():
    assert parse_hebrew_year_text("5786") == 5786


def test_parse_hebrew_letters_year():
    assert parse_hebrew_year_text("תשפו") == 5786


def test_parse_hebrew_numeric_day():
    assert parse_hebrew_day_text("12") == 12


def test_parse_hebrew_day_invalid():
    with pytest.raises(InvalidHebrewDateError):
        parse_hebrew_day_text("")
