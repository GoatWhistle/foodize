import logging
from collections.abc import Awaitable, Callable
from enum import Enum, auto
from http import HTTPStatus

import httpx
from aiogram.types import Message

from config import bot_config
from utils import messages as msg

logger = logging.getLogger(__name__)


class _BackendCallFailed(Enum):
    TOKEN = auto()


async def _call_backend_api[T](
    message: Message,
    call: Callable[[], Awaitable[T]],
    *,
    error_message: str,
    log_context: str,
) -> T | _BackendCallFailed:
    lang = msg.message_language(message)
    try:
        return await call()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == HTTPStatus.FORBIDDEN:
            await message.answer(msg.text("botAccessDenied", lang))
        else:
            logger.warning("%s HTTP error status=%s", log_context, exc.response.status_code)
            await message.answer(error_message)
    except httpx.HTTPError as exc:
        logger.warning("%s network error: %s", log_context, exc)
        await message.answer(msg.text("apiUnavailable", lang))
    return _BackendCallFailed.TOKEN


async def _ensure_bot_configured(message: Message, not_configured_message: str) -> bool:
    if bot_config.bot_api_secret:
        return True
    await message.answer(not_configured_message)
    return False


def _display_name(message: Message) -> str:
    user = message.from_user
    if not user:
        return "Telegram User"
    return user.full_name or user.username or f"Telegram {user.id}"
