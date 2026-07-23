from shared.i18n.dictionaries import DICTIONARIES
from shared.i18n.types import TranslationNode, TranslationTree

DEFAULT_LANGUAGE = "ru"
SUPPORTED_LANGUAGES = ("ru", "en")


def normalize_language(raw: str | None) -> str:
    if not raw:
        return DEFAULT_LANGUAGE
    for chunk in raw.split(","):
        code = chunk.split(";")[0].strip().lower()[:2]
        if code in SUPPORTED_LANGUAGES:
            return code
    return DEFAULT_LANGUAGE


def _lookup(tree: TranslationTree, key: str) -> TranslationNode | None:
    current: TranslationNode | None = tree
    for segment in key.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(segment)
    return current


def translate(key: str, language: str = DEFAULT_LANGUAGE, **params: object) -> str:
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
