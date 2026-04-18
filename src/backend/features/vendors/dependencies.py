from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import db_helper
from features.auth.service import get_current_user
from features.users.models import User
from features.vendors.crud import get_vendor_by_user_id
from features.vendors.exceptions import VendorAlreadyExistsException
from shared.exceptions import NotFoundException


async def get_current_vendor(
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
    user: User = Depends(get_current_user),
):
    stmt = select(User).where(User.id == user.id).options(selectinload(User.vendor_profile))
    result = await session.execute(stmt)
    loaded_user = result.scalar_one_or_none()
    return loaded_user.vendor_profile


async def ensure_no_vendor_profile(user: User, session: AsyncSession) -> None:
    vendor = await get_vendor_by_user_id(session, user.id)
    if vendor:
        raise VendorAlreadyExistsException()


async def get_vendor_or_404(user: User, session: AsyncSession):
    vendor = await get_vendor_by_user_id(session, user.id)
    if not vendor:
        raise NotFoundException()
    return vendor
