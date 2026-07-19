import uuid
from typing import Any

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from features.telegram._shared import (
    cache_telegram_id,
    delete_cached_telegram_id,
    find_or_create_telegram_user,
    make_tokens,
    normalize_username,
)
from features.telegram.crud import (
    get_telegram_id_by_user_id,
    get_user_by_phone,
    get_user_by_telegram_id,
    get_user_by_telegram_username,
)
from features.users.crud import create_user
from features.users.schemas import UserCreate
from shared.enums.roles import UserRole


@pytest.fixture(autouse=True)
def _no_redis(monkeypatch: pytest.MonkeyPatch) -> None:
    class _Cache:
        async def set(self, *args: Any, **kwargs: Any) -> None:
            return None

        async def delete(self, *args: Any, **kwargs: Any) -> None:
            return None

    monkeypatch.setattr("features.telegram._shared.get_redis_cache", lambda: _Cache())


def test_normalize_username_strips_and_lowers() -> None:
    assert normalize_username("@Ivan_TG ") == "ivan_tg"
    assert normalize_username("PLAIN") == "plain"


def test_make_tokens_returns_bearer() -> None:
    user = __import__("features.users.models", fromlist=["User"]).User()
    user.id = uuid.uuid4()
    tokens = make_tokens(user)
    assert tokens.token_type == "Bearer"
    assert tokens.access_token
    assert tokens.refresh_token


async def _seed_user(session: AsyncSession, phone: str) -> Any:
    return await create_user(
        session,
        UserCreate(
            name="Cust",
            phone_number=phone,
            password="strongpassword1",
            user_role=UserRole.CUSTOMER,
        ),
    )


async def test_create_new_telegram_user(db_session: AsyncSession) -> None:
    user = await find_or_create_telegram_user(
        db_session,
        telegram_id=999001,
        telegram_username="new_tg",
        phone_number="79005000001",
        name="New TG",
        check_username=False,
    )
    assert user.telegram_id == 999001
    assert user.telegram_username == "new_tg"
    found = await get_user_by_telegram_id(db_session, 999001)
    assert found is not None and found.id == user.id


async def test_existing_by_tg_returns_same_and_refreshes_username(
    db_session: AsyncSession,
) -> None:
    created = await find_or_create_telegram_user(
        db_session,
        telegram_id=999002,
        telegram_username="old_name",
        phone_number="79005000002",
        name="TG",
        check_username=False,
    )
    again = await find_or_create_telegram_user(
        db_session,
        telegram_id=999002,
        telegram_username="new_name",
        phone_number="ignored",
        name="TG",
        check_username=False,
        update_username_on_tg_match=True,
    )
    assert again.id == created.id
    assert again.telegram_username == "new_name"


async def test_existing_by_tg_no_refresh_when_username_unchanged(
    db_session: AsyncSession,
) -> None:
    created = await find_or_create_telegram_user(
        db_session,
        telegram_id=999009,
        telegram_username="same_name",
        phone_number="79005000009",
        name="TG",
        check_username=False,
    )
    again = await find_or_create_telegram_user(
        db_session,
        telegram_id=999009,
        telegram_username="same_name",
        phone_number="ignored",
        name="TG",
        check_username=False,
        update_username_on_tg_match=True,
    )
    assert again.id == created.id
    assert again.telegram_username == "same_name"


async def test_link_existing_by_username(db_session: AsyncSession) -> None:
    existing = await _seed_user(db_session, "79005000003")
    existing.telegram_username = "linkme"
    await db_session.flush()

    linked = await find_or_create_telegram_user(
        db_session,
        telegram_id=999003,
        telegram_username="@LinkMe",
        phone_number="79009999999",
        name="TG",
        check_username=True,
    )
    assert linked.id == existing.id
    assert linked.telegram_id == 999003
    assert linked.telegram_username == "linkme"


async def test_link_existing_by_phone(db_session: AsyncSession) -> None:
    existing = await _seed_user(db_session, "79005000004")

    linked = await find_or_create_telegram_user(
        db_session,
        telegram_id=999004,
        telegram_username="phoneuser",
        phone_number="79005000004",
        name="TG",
        check_username=False,
    )
    assert linked.id == existing.id
    assert linked.telegram_id == 999004


async def test_get_user_by_phone_and_username_crud(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "79005000005")
    user.telegram_username = "cruduser"
    user.telegram_id = 999005
    await db_session.flush()

    by_phone = await get_user_by_phone(db_session, "79005000005")
    assert by_phone is not None
    assert by_phone.id == user.id
    by_username = await get_user_by_telegram_username(db_session, "@CrudUser")
    assert by_username is not None
    assert by_username.id == user.id
    assert await get_telegram_id_by_user_id(db_session, user.id) == 999005


async def test_cache_helpers_no_error(db_session: AsyncSession) -> None:
    await cache_telegram_id("uid", 5)
    await delete_cached_telegram_id("uid")
