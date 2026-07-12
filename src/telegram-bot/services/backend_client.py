import logging
from typing import Any, cast

import httpx

from config import bot_config

logger = logging.getLogger(__name__)

_client: httpx.AsyncClient | None = None


def init_client(retries: int = 3) -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        transport = httpx.AsyncHTTPTransport(retries=retries)
        _client = httpx.AsyncClient(timeout=10, transport=transport)
    return _client


def get_client() -> httpx.AsyncClient:
    if _client is None or _client.is_closed:
        return init_client()
    return _client


async def close_client() -> None:
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()
    _client = None


def _headers() -> dict[str, str]:
    return {"X-Telegram-Bot-Secret": bot_config.bot_api_secret or ""}


def _url(path: str) -> str:
    return f"{bot_config.backend_url.rstrip('/')}/api/v1{path}"


async def link_phone(
    telegram_id: int, telegram_username: str | None, phone_number: str, name: str
) -> None:
    response = await get_client().post(
        _url("/telegram/bot/link-phone"),
        json={
            "telegram_id": telegram_id,
            "telegram_username": telegram_username,
            "phone_number": phone_number,
            "name": name,
        },
        headers=_headers(),
    )
    response.raise_for_status()


async def get_vendor_status(telegram_id: int) -> dict[str, Any]:
    response = await get_client().post(
        _url("/telegram/bot/vendor-status"),
        json={"telegram_id": telegram_id},
        headers=_headers(),
    )
    response.raise_for_status()
    return cast("dict[str, Any]", response.json().get("data", {}))


async def get_active_orders(telegram_id: int) -> list[dict[str, Any]]:
    response = await get_client().post(
        _url("/telegram/bot/orders"),
        json={"telegram_id": telegram_id},
        headers=_headers(),
    )
    response.raise_for_status()
    return cast("list[dict[str, Any]]", response.json().get("data", []))


async def register_by_telegram(
    telegram_id: int, telegram_username: str | None, name: str
) -> dict[str, Any]:
    response = await get_client().post(
        _url("/telegram/bot/register"),
        json={
            "telegram_id": telegram_id,
            "telegram_username": telegram_username,
            "name": name,
        },
        headers=_headers(),
    )
    response.raise_for_status()
    return cast("dict[str, Any]", response.json().get("data", {}))


async def get_public_restaurant(display_id: str) -> dict[str, Any]:
    response = await get_client().get(_url(f"/restaurants/public/{display_id}"))
    response.raise_for_status()
    return cast("dict[str, Any]", response.json().get("data", {}))


async def get_telegram_id_by_user(user_id: str) -> int | None:
    try:
        response = await get_client().post(
            _url("/telegram/bot/telegram-id"),
            json={"user_id": user_id},
            headers=_headers(),
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("Failed to resolve telegram_id for user_id=%s: %s", user_id, exc)
        return None
    telegram_id = response.json().get("data", {}).get("telegram_id")
    return int(telegram_id) if telegram_id is not None else None
