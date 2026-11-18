"""DTI vectors under the author's clarified convention (2026-11-18): JDN 0 = epoch anchor, JDN 1 = DY1-001,
DY = floor((JDN - 1) / 360) + 1, DOY = ((JDN - 1) mod 360) + 1.

The published DKP-0-TIME-001 table (2026-01-01 = DY6836-083, 2026-01-02 = DY6836-084, 1970-01-01 = DY6779-149,
2000-01-01 = DY6815-026) was computed with the earlier zero-based form (and its 2000-01-01 row matches neither form);
the corrected values below await the author's approval as a protocol erratum. See PROTOCOL_NOTES.md.
"""
import pytest

from converter_dti.domain.dti import dti_to_jdn, jdn_to_dti
from converter_dti.domain.errors import BeforeDtiEpochError, DtiEpochAnchorError, InvalidDtiDateError
from converter_dti.domain.formatting import format_dti_canonical
from converter_dti.domain.gregorian import gregorian_to_jdn, jdn_to_gregorian

VECTORS = [((2026, 1, 1), 2461042, 6837, 82), ((2026, 1, 2), 2461043, 6837, 83), ((1970, 1, 1), 2440588, 6780, 148),
           ((2000, 1, 1), 2451545, 6810, 305)]


@pytest.mark.parametrize("greg,jdn,dy,doy", VECTORS)
def test_recomputed_vectors(greg, jdn, dy, doy):
    assert gregorian_to_jdn(*greg) == jdn
    dti = jdn_to_dti(jdn)
    assert (dti.dy, dti.doy) == (dy, doy)
    assert format_dti_canonical(dti) == f"DY{dy}-{doy:03d}"
    assert dti_to_jdn(dy, doy) == jdn


@pytest.mark.parametrize("jdn,dy,doy", [(1, 1, 1), (360, 1, 360), (361, 2, 1), (720, 2, 360), (721, 3, 1)])
def test_author_boundaries(jdn, dy, doy):
    dti = jdn_to_dti(jdn)
    assert (dti.dy, dti.doy) == (dy, doy)
    assert dti_to_jdn(dy, doy) == jdn


def test_jdn_zero_is_the_epoch_anchor_not_a_date():
    with pytest.raises(DtiEpochAnchorError):
        jdn_to_dti(0)
    with pytest.raises(BeforeDtiEpochError):
        jdn_to_dti(-1)
    for dy in (0, -1):
        with pytest.raises(InvalidDtiDateError):
            dti_to_jdn(dy, 1)
    epoch = jdn_to_gregorian(0)                                  # the civil date of the anchor itself
    assert (epoch.year, epoch.month, epoch.day) == (-4714, 11, 24)  # 4714 BC (no year 0) = astronomical -4713


def test_every_day_of_the_first_years_round_trips():
    for jdn in range(1, 3 * 360 + 2):
        dti = jdn_to_dti(jdn)
        assert 1 <= dti.doy <= 360 and dti.dy >= 1
        assert dti_to_jdn(dti.dy, dti.doy) == jdn


def test_astronomical_julian_date_vs_civil_date_are_separate():
    """An astronomical JD starts at noon; a civil date maps to the JDN of its own (noon-centred) day."""
    civil = gregorian_to_jdn(2000, 1, 1)
    assert civil == 2451545
    assert int(2451545.0 // 1) == civil                  # 2000-01-01 12:00 TT
    assert int(2451544.5 // 1) == civil - 1              # 2000-01-01 00:00 lies in the astronomical day of Dec 31
