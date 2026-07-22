from typing import Any

from shared.i18n.dictionaries import en, ru

DICTIONARIES: dict[str, dict[str, Any]] = {
    "ru": ru.DICTIONARY,
    "en": en.DICTIONARY,
}

__all__ = ["DICTIONARIES"]
