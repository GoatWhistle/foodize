from shared.i18n.dictionaries import en, ru
from shared.i18n.types import TranslationTree

DICTIONARIES: dict[str, TranslationTree] = {
    "ru": ru.DICTIONARY,
    "en": en.DICTIONARY,
}

__all__ = ["DICTIONARIES"]
