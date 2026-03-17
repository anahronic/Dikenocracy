from converter_dti.domain.dti import dti_to_jdn, jdn_to_dti
from converter_dti.domain.gregorian import gregorian_to_jdn, jdn_to_gregorian


def test_roundtrip_gregorian_jdn_gregorian():
    jdn = gregorian_to_jdn(2026, 1, 2)
    gd = jdn_to_gregorian(jdn)
    assert (gd.year, gd.month, gd.day) == (2026, 1, 2)


def test_roundtrip_dti_jdn_dti():
    jdn = dti_to_jdn(6836, 84)
    dti = jdn_to_dti(jdn)
    assert (dti.dy, dti.doy) == (6836, 84)
