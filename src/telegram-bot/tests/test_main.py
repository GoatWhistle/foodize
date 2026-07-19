import asyncio
from http import HTTPStatus
from typing import Any, NoReturn

import pytest
from _pytest.logging import LogCaptureFixture
from aiogram import Router
from aiogram.webhook.aiohttp_server import SimpleRequestHandler
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer
from pytest_mock import MockerFixture

import main
from config import bot_config


@pytest.fixture(autouse=True)
def _fresh_start_router(mocker: MockerFixture) -> None:
    mocker.patch("main.start.router", Router())


async def test_health_endpoint_returns_ok() -> None:
    app = web.Application()
    app.router.add_get("/health", main._health)

    async with TestClient(TestServer(app)) as client:
        resp = await client.get("/health")
        assert resp.status == HTTPStatus.OK
        data = await resp.json()
        assert data == {"status": "ok"}


async def test_on_error_logs_exception_without_raising(caplog: LogCaptureFixture) -> None:
    event = type(
        "FakeErrorEvent",
        (),
        {"update": type("U", (), {"update_id": 42})(), "exception": ValueError("boom")},
    )()

    with caplog.at_level("ERROR"):
        await main._on_error(event)

    assert any("42" in record.message for record in caplog.records)
    assert any(record.exc_info for record in caplog.records)


async def test_main_raises_without_webhook_secret_in_webhook_mode(
    mocker: MockerFixture, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(bot_config, "mode", "webhook")
    monkeypatch.setattr(bot_config, "webhook_secret", "")
    monkeypatch.setattr(bot_config, "webhook_url", "https://example.com")

    mocker.patch("main.Bot")
    mocker.patch("main.build_throttling_middleware")

    with pytest.raises(RuntimeError, match="BOT_WEBHOOK_SECRET must be set"):
        await main.main()


async def test_webhook_handler_configured_with_secret_token(
    mocker: MockerFixture, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(bot_config, "mode", "webhook")
    monkeypatch.setattr(bot_config, "webhook_secret", "top-secret")
    monkeypatch.setattr(bot_config, "webhook_url", "https://example.com")

    mocker.patch("main.build_throttling_middleware")
    mocker.patch("main.start_notification_consumer", new=lambda bot: _never_ending())

    mock_bot_instance = mocker.MagicMock()
    mock_bot_instance.set_webhook = mocker.AsyncMock()
    mocker.patch("main.Bot", return_value=mock_bot_instance)

    handler_spy = mocker.patch("main.SimpleRequestHandler", wraps=SimpleRequestHandler)

    async def _stop_after_setup(*args: Any, **kwargs: Any) -> NoReturn:
        raise _StopMain

    mocker.patch("main.web.TCPSite.start", side_effect=_stop_after_setup)

    with pytest.raises(_StopMain):
        await main.main()

    assert handler_spy.call_args.kwargs["secret_token"] == "top-secret"
    mock_bot_instance.set_webhook.assert_awaited_once()
    assert mock_bot_instance.set_webhook.call_args.kwargs["secret_token"] == "top-secret"


class _StopMain(Exception):
    pass


async def _never_ending() -> None:
    await asyncio.Future()
