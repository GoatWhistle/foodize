from collections.abc import AsyncIterator

import pytest
import redis.asyncio as aioredis
from pytest_mock import MockerFixture

from config import bot_config
from services import redis_client


@pytest.fixture(autouse=True)
async def _reset(monkeypatch: pytest.MonkeyPatch) -> AsyncIterator[None]:
    monkeypatch.setattr(bot_config, "redis_url", "redis://localhost:6379/0")
    redis_client._client = None
    yield
    redis_client._client = None


def test_init_client_creates_from_url(mocker: MockerFixture) -> None:
    fake = mocker.MagicMock(spec=aioredis.Redis)
    from_url = mocker.patch("redis.asyncio.from_url", return_value=fake)

    client = redis_client.init_client()

    assert client is fake
    from_url.assert_called_once_with("redis://localhost:6379/0", decode_responses=True)


def test_init_client_is_idempotent(mocker: MockerFixture) -> None:
    mocker.patch("redis.asyncio.from_url", side_effect=lambda *a, **k: mocker.MagicMock())

    first = redis_client.init_client()
    second = redis_client.init_client()

    assert first is second


def test_get_client_initializes_when_missing(mocker: MockerFixture) -> None:
    fake = mocker.MagicMock(spec=aioredis.Redis)
    mocker.patch("redis.asyncio.from_url", return_value=fake)

    assert redis_client.get_client() is fake


async def test_close_client_closes_and_resets(mocker: MockerFixture) -> None:
    fake = mocker.MagicMock(spec=aioredis.Redis)
    fake.aclose = mocker.AsyncMock()
    mocker.patch("redis.asyncio.from_url", return_value=fake)
    redis_client.init_client()

    await redis_client.close_client()

    fake.aclose.assert_awaited_once()
    assert redis_client._client is None


async def test_close_client_noop_when_uninitialized() -> None:
    await redis_client.close_client()
    assert redis_client._client is None
