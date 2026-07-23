from shared.i18n.dictionaries.en.notifications import NOTIFICATIONS
from shared.i18n.dictionaries.en.prompts import PROMPTS
from shared.i18n.dictionaries.en.reports import REPORTS
from shared.i18n.dictionaries.en.telegram import TELEGRAM
from shared.i18n.types import TranslationTree

DICTIONARY: TranslationTree = {
    "notifications": NOTIFICATIONS,
    "prompts": PROMPTS,
    "reports": REPORTS,
    "telegram": TELEGRAM,
}

__all__ = ["DICTIONARY"]
