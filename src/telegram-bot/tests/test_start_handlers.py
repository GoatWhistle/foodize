from collections.abc import Callable
from datetime import datetime
from http import HTTPStatus

import httpx
import pytest
from aiogram.types import Contact, Message
from pytest_mock import MockerFixture

from config import bot_config
from handlers.start import (
    _auto_register,
    cmd_start,
    handle_contact,
    handle_restart_button,
)
from tests.conftest import answer_of, make_chat, make_user


@pytest.fixture(autouse=True)
def _configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(bot_config, "bot_api_secret", "secret")
    monkeypatch.setattr(bot_config, "backend_url", "http://backend")
    monkeypatch.setattr(bot_config, "mini_app_url", "https://t.me/app")


async def test_cmd_start_deep_link_restaurant(
    mocker: MockerFixture, message_factory: Callable[..., Message]
) -> None:
    mocker.patch("handlers.start.backend_client.register_by_telegram", return_value={})
    mocker.patch(
        "handlers.start.backend_client.get_public_restaurant",
        return_value={"name": "Cafe Delicious"},
    )
    message = message_factory(text="/start restaurant_123")

    await cmd_start(message)

    answer_of(message).assert_called_once()
    assert "Cafe Delicious" in answer_of(message).call_args[0][0]


async def test_cmd_start_restaurant_network_error_falls_back(
    mocker: MockerFixture, message_factory: Callable[..., Message]
) -> None:
    mocker.patch("handlers.start.backend_client.register_by_telegram", return_value={})
    mocker.patch(
        "handlers.start.backend_client.get_public_restaurant",
        side_effect=httpx.HTTPError("Err"),
    )
    message = message_factory(text="/start restaurant_123")

    await cmd_start(message)

    answer_of(message).assert_called_once()


async def test_cmd_start_deep_link_order(
    mocker: MockerFixture, message_factory: Callable[..., Message]
) -> None:
    mocker.patch("handlers.start.backend_client.register_by_telegram", return_value={})
    message = message_factory(text="/start order_456")

    await cmd_start(message)

    answer_of(message).assert_called_once()
    assert "456" in answer_of(message).call_args[0][0]


async def test_cmd_start_default_sends_welcome_and_app(
    mocker: MockerFixture, message_factory: Callable[..., Message]
) -> None:
    mocker.patch("handlers.start.backend_client.register_by_telegram", return_value={})
    message = message_factory(text="/start")

    await cmd_start(message)

    assert answer_of(message).call_count == 2


async def test_cmd_start_triggers_auto_register(
    mocker: MockerFixture, message_factory: Callable[..., Message]
) -> None:
    register = mocker.patch("handlers.start.backend_client.register_by_telegram", return_value={})
    message = message_factory(text="/start")

    await cmd_start(message)

    register.assert_awaited_once()


async def test_handle_restart_button_behaves_like_start(
    mocker: MockerFixture, message_factory: Callable[..., Message]
) -> None:
    mocker.patch("handlers.start.backend_client.register_by_telegram", return_value={})
    message = message_factory(text="/start")

    await handle_restart_button(message)

    assert answer_of(message).call_count == 2


async def test_auto_register_no_user_does_nothing(mocker: MockerFixture) -> None:
    register = mocker.patch("handlers.start.backend_client.register_by_telegram")
    message = Message.model_construct(
        message_id=1, date=datetime(2026, 1, 1), chat=make_chat(), from_user=None
    )

    await _auto_register(message)

    register.assert_not_called()


async def test_auto_register_skips_without_bot_api_secret(
    mocker: MockerFixture, monkeypatch: pytest.MonkeyPatch, message_factory: Callable[..., Message]
) -> None:
    monkeypatch.setattr(bot_config, "bot_api_secret", "")
    register = mocker.patch("handlers.start.backend_client.register_by_telegram")

    await _auto_register(message_factory())

    register.assert_not_called()


async def test_auto_register_calls_backend_with_expected_args(
    mocker: MockerFixture, message_factory: Callable[..., Message]
) -> None:
    register = mocker.patch("handlers.start.backend_client.register_by_telegram", return_value={})
    message = message_factory(
        from_user=make_user(user_id=111, username="ivan", full_name="Ivan Ivanov")
    )

    await _auto_register(message)

    register.assert_awaited_once_with(
        telegram_id=111,
        telegram_username="ivan",
        name="Ivan Ivanov",
    )


@pytest.mark.parametrize(
    "error",
    [
        httpx.HTTPStatusError(
            "Forbidden",
            request=httpx.Request("POST", "http://backend/api/v1/telegram/bot/register"),
            response=httpx.Response(
                HTTPStatus.FORBIDDEN,
                request=httpx.Request("POST", "http://backend/api/v1/telegram/bot/register"),
            ),
        ),
        httpx.HTTPError("Conn Error"),
    ],
)
async def test_auto_register_swallows_errors(
    mocker: MockerFixture, message_factory: Callable[..., Message], error: Exception
) -> None:
    mocker.patch("handlers.start.backend_client.register_by_telegram", side_effect=error)
    message = message_factory()

    await _auto_register(message)

    answer_of(message).assert_not_called()


async def test_handle_contact_no_contact_does_nothing(
    message_factory: Callable[..., Message],
) -> None:
    message = message_factory(contact=None)
    await handle_contact(message)
    answer_of(message).assert_not_called()


async def test_handle_contact_rejects_foreign_number(
    message_factory: Callable[..., Message],
) -> None:
    contact = Contact.model_construct(
        first_name="Foreign", phone_number="+79990000000", user_id=999
    )
    message = message_factory(from_user=make_user(user_id=888), contact=contact)

    await handle_contact(message)

    answer_of(message).assert_called_with("Пожалуйста, отправьте свой номер телефона.")


async def test_handle_contact_links_own_number(
    mocker: MockerFixture, message_factory: Callable[..., Message]
) -> None:
    link = mocker.patch("handlers.start.backend_client.link_phone", return_value=None)
    contact = Contact.model_construct(
        first_name="Owner", phone_number="+7 (999) 000-00-00", user_id=888
    )
    message = message_factory(from_user=make_user(user_id=888), contact=contact)

    await handle_contact(message)

    link.assert_awaited_once()
    assert link.await_args is not None
    assert link.await_args.kwargs["phone_number"] == "+79990000000"
