from utils.case_converter import camel_case_to_snake_case


def test_camel_to_snake():
    assert camel_case_to_snake_case("CamelCase") == "camel_case"
    assert camel_case_to_snake_case("camelCase") == "camel_case"
    assert camel_case_to_snake_case("HTTP") == "http"
    assert camel_case_to_snake_case("Simple") == "simple"
    assert camel_case_to_snake_case("") == ""
