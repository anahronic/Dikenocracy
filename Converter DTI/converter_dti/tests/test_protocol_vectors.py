from converter_dti.domain.dti import jdn_to_dti
from converter_dti.domain.formatting import format_dti_canonical
from converter_dti.domain.gregorian import gregorian_to_jdn


def test_protocol_vector_2026_01_01():
    jdn = gregorian_to_jdn(2026, 1, 1)
    dti = jdn_to_dti(jdn)
    assert jdn == 2461042
    assert (dti.dy, dti.doy) == (6836, 83)


def test_protocol_vector_2026_01_02():
    jdn = gregorian_to_jdn(2026, 1, 2)
    dti = jdn_to_dti(jdn)
    assert jdn == 2461043
    assert (dti.dy, dti.doy) == (6836, 84)


def test_protocol_vector_1970_01_01():
    jdn = gregorian_to_jdn(1970, 1, 1)
    dti = jdn_to_dti(jdn)
    assert jdn == 2440588
    assert (dti.dy, dti.doy) == (6779, 149)


def test_protocol_vector_2000_01_01():
    jdn = gregorian_to_jdn(2000, 1, 1)
    dti = jdn_to_dti(jdn)
    assert jdn == 2451545
    assert (dti.dy, dti.doy) == (6809, 306)
    assert format_dti_canonical(dti) == "DY6809-306"
