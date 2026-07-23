import logging

import httpx

from config import bot_config
from services.payloads import (
    OrderPayload,
    RegisterPayload,
    RestaurantPayload,
    VendorStatusPayload,
)

logger = logging.getLogger(__name__)

_client: httpx.AsyncClient | None = None

type JsonValue = str | int | float | bool | None | list["JsonValue"] | dict[str, "JsonValue"]
type RequestPayload = dict[str, JsonValue]


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


async def _post_bot_api(path: str, payload: RequestPayload) -> httpx.Response:
    response = await get_client().post(_url(path), json=payload, headers=_headers())
    response.raise_for_status()
    return response


def _payload_object(response: httpx.Response) -> dict[str, JsonValue]:
    body: JsonValue = response.json()
    if not isinstance(body, dict):
        return {}
    data = body.get("data")
    return data if isinstance(data, dict) else {}


def _payload_list(response: httpx.Response) -> list[JsonValue]:
    body: JsonValue = response.json()
    if not isinstance(body, dict):
        return []
    data = body.get("data")
    return data if isinstance(data, list) else []


async def link_phone(
    telegram_id: int, telegram_username: str | None, phone_number: str, name: str
) -> None:
    await _post_bot_api(
        "/telegram/bot/link-phone",
        {
            "telegram_id": telegram_id,
            "telegram_username": telegram_username,
            "phone_number": phone_number,
            "name": name,
        },
    )


async def get_vendor_status(telegram_id: int) -> VendorStatusPayload:
    response = await _post_bot_api("/telegram/bot/vendor-status", {"telegram_id": telegram_id})
    payload = _payload_object(response)
    return VendorStatusPayload(
        is_vendor=bool(payload.get("is_vendor")),
        approval_status=_optional_str(payload.get("approval_status")),
        rejection_reason=_optional_str(payload.get("rejection_reason")),
    )


async def get_active_orders(telegram_id: int) -> list[OrderPayload]:
    response = await _post_bot_api("/telegram/bot/orders", {"telegram_id": telegram_id})
    return [_to_order(item) for item in _payload_list(response) if isinstance(item, dict)]


async def register_by_telegram(
    telegram_id: int, telegram_username: str | None, name: str
) -> RegisterPayload:
    response = await _post_bot_api(
        "/telegram/bot/register",
        {
            "telegram_id": telegram_id,
            "telegram_username": telegram_username,
            "name": name,
        },
    )
    payload = _payload_object(response)
    return RegisterPayload(
        id=_optional_str(payload.get("id")) or "",
        telegram_id=_optional_int(payload.get("telegram_id")) or 0,
    )


async def get_public_restaurant(display_id: str) -> RestaurantPayload:
    response = await get_client().get(_url(f"/restaurants/public/{display_id}"))
    response.raise_for_status()
    payload = _payload_object(response)
    return RestaurantPayload(
        id=_optional_str(payload.get("id")) or "",
        display_id=_optional_str(payload.get("display_id")) or "",
        name=_optional_str(payload.get("name")) or "",
    )


async def get_telegram_id_by_user(user_id: str) -> int | None:
    try:
        response = await _post_bot_api("/telegram/bot/telegram-id", {"user_id": user_id})
    except httpx.HTTPError as exc:
        logger.warning("Failed to resolve telegram_id for user_id=%s: %s", user_id, exc)
        return None
    return _optional_int(_payload_object(response).get("telegram_id"))


def _optional_str(value: JsonValue) -> str | None:
    return value if isinstance(value, str) else None


def _optional_int(value: JsonValue) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.isdigit():
        return int(value)
    return None


def _to_order(item: dict[str, JsonValue]) -> OrderPayload:
    display_id = item.get("display_id")
    return OrderPayload(
        id=_optional_str(item.get("id")) or "",
        display_id=display_id if isinstance(display_id, str | int) else "",
        restaurant_name=_optional_str(item.get("restaurant_name")),
        status=_optional_str(item.get("status")) or "",
        total_price=_optional_int(item.get("total_price")) or 0,
    )
