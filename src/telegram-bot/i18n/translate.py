from typing import Any

from i18n.dictionaries import DICTIONARIES

DEFAULT_LANGUAGE = "ru"
SUPPORTED_LANGUAGES = ("ru", "en")


def normalize_language(raw: str | None) -> str:
    if not raw:
        return DEFAULT_LANGUAGE
    code = raw.split("-")[0].strip().lower()[:2]
    return code if code in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE


def _lookup(tree: dict[str, Any], key: str) -> Any:
    current: Any = tree
    for segment in key.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(segment)
    return current


def translate(key: str, language: str = DEFAULT_LANGUAGE, **params: Any) -> str:
    lang = language if language in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE
    value = _lookup(DICTIONARIES[lang], key)
    if value is None:
        value = _lookup(DICTIONARIES[DEFAULT_LANGUAGE], key)
    if not isinstance(value, str):
        return key
    if not params:
        return value
    try:
        return value.format(**params)
    except (KeyError, IndexError):
        return value
