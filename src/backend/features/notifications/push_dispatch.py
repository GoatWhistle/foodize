import time
from typing import Protocol, runtime_checkable

import httpx
import jwt

from features.notifications.push_models import PushDevice, PushPlatform
from settings.config.app_config import settings
from utils.logging_setup import get_logger

logger = get_logger(__name__)

_APNS_JWT_TTL_SECONDS = 3000


@runtime_checkable
class PushProvider(Protocol):
    @property
    def enabled(self) -> bool: ...

    def handles(self, platform: str) -> bool: ...

    async def send(
        self,
        device: PushDevice,
        title: str,
        body: str,
        data: dict[str, str],
    ) -> bool: ...


class ApnsProvider:
    def __init__(self) -> None:
        self._token: str | None = None
        self._token_issued_at: float = 0.0

    @property
    def enabled(self) -> bool:
        return settings.push.apns_enabled

    def handles(self, platform: str) -> bool:
        return platform == PushPlatform.IOS.value

    def _auth_token(self) -> str:
        now = time.time()
        if self._token is not None and now - self._token_issued_at < _APNS_JWT_TTL_SECONDS:
            return self._token
        assert settings.push.apns_key is not None
        assert settings.push.apns_key_id is not None
        assert settings.push.apns_team_id is not None
        token = jwt.encode(
            {"iss": settings.push.apns_team_id, "iat": int(now)},
            settings.push.apns_key,
            algorithm="ES256",
            headers={"kid": settings.push.apns_key_id},
        )
        self._token = token
        self._token_issued_at = now
        return token

    def _base_url(self) -> str:
        if settings.push.apns_use_sandbox:
            return settings.push.apns_sandbox_base_url
        return settings.push.apns_base_url

    async def send(
        self,
        device: PushDevice,
        title: str,
        body: str,
        data: dict[str, str],
    ) -> bool:
        payload: dict[str, object] = {
            "aps": {"alert": {"title": title, "body": body}, "sound": "default"},
            **data,
        }
        headers = {
            "authorization": f"bearer {self._auth_token()}",
            "apns-topic": settings.push.apns_topic or "",
            "apns-push-type": "alert",
        }
        url = f"{self._base_url()}/3/device/{device.token}"
        try:
            async with httpx.AsyncClient(
                http2=True, timeout=settings.push.request_timeout_seconds
            ) as client:
                response = await client.post(url, json=payload, headers=headers)
        except ImportError:
            logger.warning("apns_http2_unavailable", token=device.token[:12])
            return False
        except httpx.HTTPError:
            logger.exception("apns_send_failed", token=device.token[:12])
            return False
        if response.status_code >= 400:
            logger.warning(
                "apns_send_rejected",
                status=response.status_code,
                token=device.token[:12],
            )
            return False
        return True


class FcmProvider:
    @property
    def enabled(self) -> bool:
        return bool(settings.push.fcm_server_key)

    def handles(self, platform: str) -> bool:
        return platform in (PushPlatform.ANDROID.value, PushPlatform.WEB.value)

    async def send(
        self,
        device: PushDevice,
        title: str,
        body: str,
        data: dict[str, str],
    ) -> bool:
        payload = {
            "to": device.token,
            "notification": {"title": title, "body": body},
            "data": data,
        }
        headers = {
            "Authorization": f"key={settings.push.fcm_server_key}",
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=settings.push.request_timeout_seconds) as client:
                response = await client.post(
                    "https://fcm.googleapis.com/fcm/send", json=payload, headers=headers
                )
        except httpx.HTTPError:
            logger.exception("fcm_send_failed", token=device.token[:12])
            return False
        if response.status_code >= 400:
            logger.warning(
                "fcm_send_rejected",
                status=response.status_code,
                token=device.token[:12],
            )
            return False
        return True


_PROVIDERS: tuple[PushProvider, ...] = (ApnsProvider(), FcmProvider())


async def send_native_push(
    devices: list[PushDevice],
    title: str,
    body: str,
    data: dict[str, str] | None = None,
) -> int:
    if not devices:
        return 0
    active_providers = [provider for provider in _PROVIDERS if provider.enabled]
    if not active_providers:
        logger.debug("push_providers_disabled", devices=len(devices))
        return 0

    payload_data = data or {}
    delivered = 0
    for device in devices:
        provider = next((p for p in active_providers if p.handles(device.platform)), None)
        if provider is None:
            continue
        if await provider.send(device, title, body, payload_data):
            delivered += 1
    return delivered
