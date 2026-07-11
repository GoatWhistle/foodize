import pytest
from aiogram import Router
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

import main
from config import bot_config


@pytest.fixture(autouse=True)
def _fresh_start_router(mocker):
    mocker.patch("main.start.router", Router())


@pytest.mark.asyncio
async def test_health_endpoint_returns_ok():
    app = web.Application()
    app.router.add_get("/health", main._health)

    async with TestClient(TestServer(app)) as client:
        resp = await client.get("/health")
        assert resp.status == 200
        data = await resp.json()
        assert data == {"status": "ok"}


@pytest.mark.asyncio
async def test_on_error_logs_exception_without_raising(caplog):
    event = type(
        "FakeErrorEvent",
        (),
        {"update": type("U", (), {"update_id": 42})(), "exception": ValueError("boom")},
    )()
    await main._on_error(event)


@pytest.mark.asyncio
async def test_main_raises_without_webhook_secret_in_webhook_mode(mocker):
    bot_config.mode = "webhook"
    bot_config.webhook_secret = ""
    bot_config.webhook_url = "https://example.com"

    mocker.patch("main.Bot")
    mocker.patch("main.build_throttling_middleware")

    with pytest.raises(RuntimeError, match="BOT_WEBHOOK_SECRET must be set"):
        await main.main()

    bot_config.mode = "polling"


@pytest.mark.asyncio
async def test_webhook_handler_configured_with_secret_token(mocker):
    bot_config.mode = "webhook"
    bot_config.webhook_secret = "top-secret"
    bot_config.webhook_url = "https://example.com"

    mocker.patch("main.build_throttling_middleware")
    mocker.patch("main.start_notification_consumer", new=lambda bot: _never_ending())

    mock_bot_instance = mocker.MagicMock()
    mock_bot_instance.set_webhook = mocker.AsyncMock()
    mocker.patch("main.Bot", return_value=mock_bot_instance)

    handler_spy = mocker.patch("main.SimpleRequestHandler", wraps=main.SimpleRequestHandler)

    async def _stop_after_setup(*args, **kwargs):
        raise _StopMain()

    mocker.patch("main.web.TCPSite.start", side_effect=_stop_after_setup)

    with pytest.raises(_StopMain):
        await main.main()

    assert handler_spy.call_args.kwargs["secret_token"] == "top-secret"
    mock_bot_instance.set_webhook.assert_awaited_once()
    assert mock_bot_instance.set_webhook.call_args.kwargs["secret_token"] == "top-secret"

    bot_config.mode = "polling"


class _StopMain(Exception):
    pass


async def _never_ending():
    import asyncio

    await asyncio.Future()
