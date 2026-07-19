import os
from collections.abc import AsyncIterator, Callable
from datetime import datetime
from typing import cast
from unittest.mock import AsyncMock

os.environ["BOT_TOKEN"] = "test_bot_token"
os.environ["BACKEND_URL"] = "http://localhost:8000"
os.environ["MINI_APP_URL"] = "https://t.me/app"
os.environ["TELEGRAM_BOT_API_SECRET"] = "secret"
os.environ["REDIS__URL"] = "redis://localhost:6379/0"
os.environ["RABBITMQ__URL"] = "amqp://test"
os.environ["BOT_MODE"] = "polling"

import pytest
from aiogram import Bot, Dispatcher
from aiogram.types import Chat, Contact, Message, Update, User

from handlers import start


def make_user(
    user_id: int = 111, username: str | None = "tester", full_name: str = "Test User"
) -> User:
    first_name, _, last_name = full_name.partition(" ")
    return User.model_construct(
        id=user_id,
        is_bot=False,
        first_name=first_name or full_name,
        last_name=last_name or None,
        username=username,
    )


def make_chat(chat_id: int = 111) -> Chat:
    return Chat.model_construct(id=chat_id, type="private")


class _Unset:
    pass


_UNSET = _Unset()


def answer_of(message: Message) -> AsyncMock:
    return cast("AsyncMock", message.answer)


@pytest.fixture
def message_factory() -> Callable[..., Message]:
    def _factory(
        text: str | None = None,
        from_user: User | None | _Unset = _UNSET,
        contact: Contact | None = None,
    ) -> Message:
        resolved_user = make_user() if isinstance(from_user, _Unset) else from_user
        message = Message.model_construct(
            message_id=1,
            date=datetime(2026, 1, 1),
            chat=make_chat(),
            from_user=resolved_user,
            text=text,
            contact=contact,
        )
        object.__setattr__(message, "answer", AsyncMock())
        return message

    return _factory


@pytest.fixture
def update_factory(message_factory: Callable[..., Message]) -> Callable[..., Update]:
    def _factory(**message_kwargs: object) -> Update:
        message = message_factory(**message_kwargs)
        return Update.model_construct(update_id=1, message=message)

    return _factory


@pytest.fixture
def bot() -> AsyncMock:
    fake_bot = AsyncMock(spec=Bot)
    fake_bot.id = 42
    return fake_bot


@pytest.fixture
async def dispatcher() -> AsyncIterator[Dispatcher]:
    dp = Dispatcher()
    dp.include_router(start.router)
    yield dp
    start.router._parent_router = None
    await dp.storage.close()
