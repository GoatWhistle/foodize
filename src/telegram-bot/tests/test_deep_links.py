from handlers.deep_links import DeepLinkKind, parse_deep_link, parse_start_arg


def test_parse_start_arg() -> None:
    assert parse_start_arg(None) == ""
    assert parse_start_arg("/start") == ""
    assert parse_start_arg("/start restaurant_42") == "restaurant_42"
    assert parse_start_arg("/start   order_7  ") == "order_7"


def test_parse_deep_link_none() -> None:
    assert parse_deep_link("").kind is DeepLinkKind.NONE
    assert parse_deep_link("unknown").kind is DeepLinkKind.NONE


def test_parse_deep_link_restaurant() -> None:
    link = parse_deep_link("restaurant_abc-123")
    assert link.kind is DeepLinkKind.RESTAURANT
    assert link.value == "abc-123"


def test_parse_deep_link_restaurant_invalid() -> None:
    assert parse_deep_link("restaurant_bad id!").kind is DeepLinkKind.INVALID
    assert parse_deep_link("restaurant_" + "a" * 65).kind is DeepLinkKind.INVALID


def test_parse_deep_link_order() -> None:
    link = parse_deep_link("order_456")
    assert link.kind is DeepLinkKind.ORDER
    assert link.value == "456"


def test_parse_deep_link_order_invalid() -> None:
    assert parse_deep_link("order_abc").kind is DeepLinkKind.INVALID
    assert parse_deep_link("order_12345678901").kind is DeepLinkKind.INVALID
