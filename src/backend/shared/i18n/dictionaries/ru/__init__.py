from typing import Any

from shared.i18n.dictionaries.ru.notifications import NOTIFICATIONS
from shared.i18n.dictionaries.ru.prompts import PROMPTS
from shared.i18n.dictionaries.ru.reports import REPORTS
from shared.i18n.dictionaries.ru.telegram import TELEGRAM

DICTIONARY: dict[str, Any] = {
    "notifications": NOTIFICATIONS,
    "prompts": PROMPTS,
    "reports": REPORTS,
    "telegram": TELEGRAM,
}

__all__ = ["DICTIONARY"]
