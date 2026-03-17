from converter_dti.domain.gregorian import jdn_to_gregorian


def test_jdn_to_gregorian_vector_2461043():
    gd = jdn_to_gregorian(2461043)
    assert (gd.year, gd.month, gd.day) == (2026, 1, 2)


def test_jdn_to_gregorian_vector_2451545():
    gd = jdn_to_gregorian(2451545)
    assert (gd.year, gd.month, gd.day) == (2000, 1, 1)
