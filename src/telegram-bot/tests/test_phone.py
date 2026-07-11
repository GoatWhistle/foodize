from utils.phone import normalize_phone


def test_normalize_phone():
    assert normalize_phone("89990000000") == "+79990000000"
    assert normalize_phone("+79990000000") == "+79990000000"
    assert normalize_phone("  +7-999-000-00-00  ") == "+79990000000"
    assert normalize_phone("7 (999) 000-00-00") == "+79990000000"
