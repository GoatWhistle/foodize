from typing import Any

from i18n.dictionaries import en, ru

DICTIONARIES: dict[str, dict[str, Any]] = {
    "ru": ru.DICTIONARY,
    "en": en.DICTIONARY,
}

__all__ = ["DICTIONARIES"]
