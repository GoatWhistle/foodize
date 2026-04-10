import uuid

import pytest
from sqlalchemy.exc import IntegrityError

from features.users.crud import create_user
from features.users.dependencies import get_user_by_id, get_user_by_phone
from features.users.schemas import UserCreate
from shared.enums.roles import UserRole


@pytest.mark.asyncio
async def test_create_and_get_user(db_session):
    user_data = UserCreate(
        name="Ivan",
        phone_number="79001234567",
        password="secretpassword",
        user_role=UserRole.CUSTOMER,
    )

    user = await create_user(db_session, user_data)

    assert user.id is not None
    assert isinstance(user.id, uuid.UUID)
    assert user.name == "Ivan"
    assert user.phone_number == "79001234567"
    assert user.user_role in (UserRole.CUSTOMER, UserRole.CUSTOMER.value)

    fetched_user = await get_user_by_id(db_session, user.id)
    assert fetched_user is not None
    assert fetched_user.id == user.id

    fetched_by_phone = await get_user_by_phone(db_session, "79001234567")
    assert fetched_by_phone is not None
    assert fetched_by_phone.id == user.id


@pytest.mark.asyncio
async def test_create_user_duplicate_phone(db_session):
    user_data = UserCreate(
        name="Ivan",
        phone_number="79009999999",
        password="secretpassword",
        user_role=UserRole.CUSTOMER,
    )
    await create_user(db_session, user_data)

    user_data_2 = UserCreate(
        name="Petr",
        phone_number="79009999999",
        password="anotherpassword",
        user_role=UserRole.CUSTOMER,
    )

    with pytest.raises(IntegrityError):
        await create_user(db_session, user_data_2)
