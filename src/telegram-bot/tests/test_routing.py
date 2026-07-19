from collections.abc import Callable
from unittest.mock import AsyncMock

import pytest
from aiogram import Bot, Dispatcher
from aiogram.types import Message, Update
from pytest_mock import MockerFixture

from config import bot_config
from keyboards.start_keyboards import RESTART_TEXT


@pytest.fixture
def answer_spy(mocker: MockerFixture) -> AsyncMock:
    return mocker.patch.object(Message, "answer", new_callable=AsyncMock)


@pytest.fixture(autouse=True)
def _configured(monkeypatch: pytest.MonkeyPatch, mocker: MockerFixture) -> None:
    monkeypatch.setattr(bot_config, "bot_api_secret", "secret")
    monkeypatch.setattr(bot_config, "backend_url", "http://backend")
    monkeypatch.setattr(bot_config, "mini_app_url", "https://t.me/app")
    mocker.patch("handlers.start.backend_client.register_by_telegram", return_value={})


async def test_start_command_reaches_handler(
    dispatcher: Dispatcher,
    bot: Bot,
    update_factory: Callable[..., Update],
    answer_spy: AsyncMock,
) -> None:
    update = update_factory(text="/start")

    await dispatcher.feed_update(bot, update)

    answer_spy.assert_called()


async def test_orders_command_reaches_handler(
    dispatcher: Dispatcher,
    bot: Bot,
    update_factory: Callable[..., Update],
    answer_spy: AsyncMock,
    mocker: MockerFixture,
) -> None:
    mocker.patch("handlers.start.backend_client.get_active_orders", return_value=[])
    update = update_factory(text="/orders")

    await dispatcher.feed_update(bot, update)

    answer_spy.assert_called_with("Активных заказов сейчас нет.")


async def test_vendor_status_command_reaches_handler(
    dispatcher: Dispatcher,
    bot: Bot,
    update_factory: Callable[..., Update],
    answer_spy: AsyncMock,
    mocker: MockerFixture,
) -> None:
    mocker.patch(
        "handlers.start.backend_client.get_vendor_status",
        return_value={"is_vendor": False},
    )
    update = update_factory(text="/vendor_status")

    await dispatcher.feed_update(bot, update)

    assert "профиль не найден" in answer_spy.call_args[0][0]


async def test_restart_button_reaches_handler(
    dispatcher: Dispatcher,
    bot: Bot,
    update_factory: Callable[..., Update],
    answer_spy: AsyncMock,
) -> None:
    update = update_factory(text=RESTART_TEXT)

    await dispatcher.feed_update(bot, update)

    answer_spy.assert_called()


async def test_unknown_text_is_not_handled(
    dispatcher: Dispatcher,
    bot: Bot,
    update_factory: Callable[..., Update],
    answer_spy: AsyncMock,
) -> None:
    update = update_factory(text="just some text")

    await dispatcher.feed_update(bot, update)

    answer_spy.assert_not_called()
