import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from features.notifications.push_dispatch import (
    ApnsProvider,
    FcmProvider,
    send_native_push,
)
from features.notifications.push_models import PushDevice, PushPlatform


def _make_device(platform: str, token: str = "tok") -> MagicMock:
    device = MagicMock(spec=PushDevice)
    device.id = uuid.uuid4()
    device.user_id = uuid.uuid4()
    device.token = token
    device.platform = platform
    device.is_active = True
    return device


class TestSendNativePush:
    async def test_no_devices_is_noop(self) -> None:
        delivered = await send_native_push([], "t", "b", {})
        assert delivered == 0

    async def test_no_credentials_is_noop(self) -> None:
        device = _make_device(PushPlatform.IOS.value)
        apns = MagicMock(spec=ApnsProvider)
        apns.enabled = False
        fcm = MagicMock(spec=FcmProvider)
        fcm.enabled = False
        with patch("features.notifications.push_dispatch._PROVIDERS", (apns, fcm)):
            delivered = await send_native_push([device], "t", "b", None)
        assert delivered == 0

    async def test_dispatches_to_matching_provider(self) -> None:
        device = _make_device(PushPlatform.ANDROID.value)
        apns = MagicMock(spec=ApnsProvider)
        apns.enabled = True
        apns.handles = MagicMock(return_value=False)
        apns.send = AsyncMock(return_value=True)
        fcm = MagicMock(spec=FcmProvider)
        fcm.enabled = True
        fcm.handles = MagicMock(return_value=True)
        fcm.send = AsyncMock(return_value=True)
        with patch("features.notifications.push_dispatch._PROVIDERS", (apns, fcm)):
            delivered = await send_native_push([device], "t", "b", {"k": "v"})
        assert delivered == 1
        fcm.send.assert_awaited_once()
        apns.send.assert_not_awaited()

    async def test_provider_failure_does_not_raise(self) -> None:
        device = _make_device(PushPlatform.IOS.value)
        apns = MagicMock(spec=ApnsProvider)
        apns.enabled = True
        apns.handles = MagicMock(return_value=True)
        apns.send = AsyncMock(return_value=False)
        with patch("features.notifications.push_dispatch._PROVIDERS", (apns,)):
            delivered = await send_native_push([device], "t", "b", {})
        assert delivered == 0

    async def test_unhandled_platform_skipped(self) -> None:
        device = _make_device("unknown")
        apns = MagicMock(spec=ApnsProvider)
        apns.enabled = True
        apns.handles = MagicMock(return_value=False)
        apns.send = AsyncMock(return_value=True)
        with patch("features.notifications.push_dispatch._PROVIDERS", (apns,)):
            delivered = await send_native_push([device], "t", "b", {})
        assert delivered == 0
        apns.send.assert_not_awaited()


class TestProviderEnabled:
    def test_apns_disabled_without_credentials(self) -> None:
        with patch("features.notifications.push_dispatch.settings") as mock_settings:
            mock_settings.push.apns_enabled = False
            assert ApnsProvider().enabled is False

    def test_fcm_disabled_without_key(self) -> None:
        with patch("features.notifications.push_dispatch.settings") as mock_settings:
            mock_settings.push.fcm_server_key = None
            assert FcmProvider().enabled is False

    def test_apns_handles_ios_only(self) -> None:
        provider = ApnsProvider()
        assert provider.handles(PushPlatform.IOS.value) is True
        assert provider.handles(PushPlatform.ANDROID.value) is False

    def test_fcm_handles_android_and_web(self) -> None:
        provider = FcmProvider()
        assert provider.handles(PushPlatform.ANDROID.value) is True
        assert provider.handles(PushPlatform.WEB.value) is True
        assert provider.handles(PushPlatform.IOS.value) is False
