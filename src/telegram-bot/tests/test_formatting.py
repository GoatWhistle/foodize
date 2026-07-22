from utils import messages as msg
from utils.formatting import format_price, format_status


def test_format_price() -> None:
    assert format_price(100) == "1,00 ₽"
    assert format_price(1050) == "10,50 ₽"
    assert format_price(99) == "0,99 ₽"


def test_format_status() -> None:
    assert format_status("PENDING") == msg.order_status("PENDING")
    assert format_status("COOKING") == msg.order_status("COOKING")
    assert format_status("UNKNOWN") == "UNKNOWN"
