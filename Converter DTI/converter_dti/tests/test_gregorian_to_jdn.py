from converter_dti.domain.gregorian import gregorian_to_jdn


def test_gregorian_to_jdn_vector_2026_01_01():
    assert gregorian_to_jdn(2026, 1, 1) == 2461042


def test_gregorian_to_jdn_vector_1970_01_01():
    assert gregorian_to_jdn(1970, 1, 1) == 2440588
