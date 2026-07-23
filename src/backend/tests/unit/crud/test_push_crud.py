import uuid
from unittest.mock import AsyncMock, MagicMock

from features.notifications.push_crud import (
    deactivate_device,
    get_active_devices_for_user,
    upsert_device,
)
from features.notifications.push_models import PushDevice, PushPlatform


def _make_device(user_id: uuid.UUID, token: str) -> MagicMock:
    device = MagicMock(spec=PushDevice)
    device.id = uuid.uuid4()
    device.user_id = user_id
    device.token = token
    device.platform = PushPlatform.IOS.value
    device.is_active = True
    return device


class TestUpsertDevice:
    async def test_returns_device(self) -> None:
        session = AsyncMock()
        uid = uuid.uuid4()
        device = _make_device(uid, "tok-1")
        result_mock = MagicMock()
        result_mock.scalar_one.return_value = device
        session.execute = AsyncMock(return_value=result_mock)

        returned = await upsert_device(session, uid, "tok-1", PushPlatform.IOS.value, "en")

        assert returned is device
        session.execute.assert_awaited_once()
        session.flush.assert_awaited_once()

    async def test_is_idempotent_on_token(self) -> None:
        session = AsyncMock()
        uid = uuid.uuid4()
        device = _make_device(uid, "tok-dup")
        result_mock = MagicMock()
        result_mock.scalar_one.return_value = device
        session.execute = AsyncMock(return_value=result_mock)

        first = await upsert_device(session, uid, "tok-dup", PushPlatform.IOS.value, None)
        second = await upsert_device(session, uid, "tok-dup", PushPlatform.IOS.value, None)

        assert first.token == second.token == "tok-dup"
        assert session.execute.await_count == 2


class TestDeactivateDevice:
    async def test_returns_true_when_updated(self) -> None:
        session = AsyncMock()
        result_mock = MagicMock()
        result_mock.rowcount = 1
        session.execute = AsyncMock(return_value=result_mock)

        deactivated = await deactivate_device(session, uuid.uuid4(), "tok-1")

        assert deactivated is True
        session.flush.assert_awaited_once()

    async def test_returns_false_when_not_found(self) -> None:
        session = AsyncMock()
        result_mock = MagicMock()
        result_mock.rowcount = 0
        session.execute = AsyncMock(return_value=result_mock)

        deactivated = await deactivate_device(session, uuid.uuid4(), "missing")

        assert deactivated is False


class TestGetActiveDevices:
    async def test_returns_active_devices(self) -> None:
        session = AsyncMock()
        uid = uuid.uuid4()
        devices = [_make_device(uid, "a"), _make_device(uid, "b")]
        scalars_mock = MagicMock()
        scalars_mock.all.return_value = devices
        result_mock = MagicMock()
        result_mock.scalars.return_value = scalars_mock
        session.execute = AsyncMock(return_value=result_mock)

        returned = await get_active_devices_for_user(session, uid)

        assert returned == devices
