from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.restaurants.models import Restaurant
from features.staff.crud import (
    create_staff_profile,
    create_staff_request,
    get_last_request,
    get_staff_profile_by_user_id,
    update_request_status,
)
from features.staff.schemas import StaffRequestCreate
from features.users.crud import create_user, update_user
from features.users.models import User
from features.users.schemas import UserCreate, UserUpdate
from seed.data import STAFF_REQUEST_APPLICANTS
from shared.enums.staff_request_status import StaffRequestStatus


async def _ensure_applicant(session: AsyncSession, data: dict[str, Any]) -> User:
    result = await session.execute(
        select(User).where(User.phone_number == data["phone_number"])
    )
    user = result.scalar_one_or_none()
    if user is not None:
        return user
    user = await create_user(
        session,
        UserCreate(
            name=data["name"],
            phone_number=data["phone_number"],
            password=data["password"],
        ),
    )
    await update_user(
        session,
        user,
        UserUpdate(
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            middle_name=data.get("middle_name"),
            email=data.get("email"),
        ),
    )
    await session.commit()
    return user


def _pick_hiring_restaurant(all_restaurants: list[Restaurant]) -> Restaurant | None:
    for restaurant in all_restaurants:
        if restaurant.is_hiring:
            return restaurant
    return all_restaurants[0] if all_restaurants else None


async def seed_staff_requests(
    session: AsyncSession, all_restaurants: list[Restaurant]
) -> None:
    print("\n── Staff requests ──────────────────────")
    restaurant = _pick_hiring_restaurant(all_restaurants)
    if restaurant is None:
        print("  skip (no restaurants)")
        return

    for data in STAFF_REQUEST_APPLICANTS:
        user = await _ensure_applicant(session, data)
        existing = await get_last_request(session, user.id, restaurant.id)
        if existing is not None:
            print(f"  skip request (exists): {data['name']}")
            continue

        request = await create_staff_request(
            session,
            user.id,
            restaurant.id,
            StaffRequestCreate(message=data["message"]),
        )
        status = StaffRequestStatus(data["status"])
        await update_request_status(session, request, status)

        if status is StaffRequestStatus.ACCEPTED:
            profile = await get_staff_profile_by_user_id(session, user.id)
            if profile is None:
                await create_staff_profile(session, user.id, restaurant.id)
        await session.commit()
        print(f"  request [{status.value}]: {data['name']} → '{restaurant.name}'")
