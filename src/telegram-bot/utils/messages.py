from aiogram.types import Message

from i18n import DEFAULT_LANGUAGE, normalize_language, translate


def message_language(message: Message | None) -> str:
    user = message.from_user if message else None
    return normalize_language(user.language_code if user else None)


def text(key: str, language: str = DEFAULT_LANGUAGE, **params: str | int) -> str:
    return translate(f"bot.messages.{key}", language, **params)


def button(key: str, language: str = DEFAULT_LANGUAGE, **params: str | int) -> str:
    return translate(f"bot.buttons.{key}", language, **params)


def order_status(status: str, language: str = DEFAULT_LANGUAGE) -> str:
    label = translate(f"bot.orderStatus.{status}", language)
    return status if label == f"bot.orderStatus.{status}" else label


def notification(key: str, language: str = DEFAULT_LANGUAGE, **params: str | int) -> str:
    return translate(f"bot.notifications.{key}", language, **params)


def fallback(key: str, language: str = DEFAULT_LANGUAGE) -> str:
    return translate(f"bot.fallback.{key}", language)
