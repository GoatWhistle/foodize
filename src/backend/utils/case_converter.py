import re

import inflect

inflector = inflect.engine()


def camel_case_to_snake_case(name: str) -> str:
    s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


def _pluralize_word(word: str) -> str:
    if inflector.singular_noun(word):
        return word
    plural = str(inflector.plural(word))
    if word.endswith("o") and plural.endswith("oes"):
        return f"{word}s"
    return plural


def pluralize_snake_case(name: str) -> str:
    snake = camel_case_to_snake_case(name)
    head, _, last = snake.rpartition("_")
    pluralized = _pluralize_word(last)
    return f"{head}_{pluralized}" if head else pluralized
