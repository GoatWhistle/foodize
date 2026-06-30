import httpx

from config import bot_config


def _headers() -> dict[str, str]:
    return {"X-Telegram-Bot-Secret": bot_config.bot_api_secret or ""}


def _url(path: str) -> str:
    return f"{bot_config.backend_url.rstrip('/')}/api/v1{path}"


async def link_phone(telegram_id: int, telegram_username: str | None, phone_number: str, name: str) -> None:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
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


async def get_vendor_status(telegram_id: int) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            _url("/telegram/bot/vendor-status"),
            json={"telegram_id": telegram_id},
            headers=_headers(),
        )
        response.raise_for_status()
        return response.json().get("data", {})


async def get_active_orders(telegram_id: int) -> list[dict]:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            _url("/telegram/bot/orders"),
            json={"telegram_id": telegram_id},
            headers=_headers(),
        )
        response.raise_for_status()
        return response.json().get("data", [])


async def register_by_telegram(telegram_id: int, telegram_username: str | None, name: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            _url("/telegram/bot/register"),
            json={
                "telegram_id": telegram_id,
                "telegram_username": telegram_username,
                "name": name,
            },
            headers=_headers(),
        )
        response.raise_for_status()
        return response.json().get("data", {})


async def get_public_restaurant(display_id: str) -> dict:
    async with httpx.AsyncClient(timeout=5) as client:
        response = await client.get(_url(f"/restaurants/public/{display_id}"))
        response.raise_for_status()
        return response.json().get("data", {})
