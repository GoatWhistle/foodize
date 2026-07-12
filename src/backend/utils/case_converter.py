import re

import inflect

inflector = inflect.engine()


def camel_case_to_snake_case(name: str) -> str:
    s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


def pluralize_snake_case(name: str) -> str:
    singular = camel_case_to_snake_case(name)
    return inflector.plural(singular)
