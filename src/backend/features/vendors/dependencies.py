from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import db_helper
from features import User
from features.auth.service import get_current_user
from features.vendors.crud import get_vendor_profile
from features.vendors.exeptions import VendorAlreadyExistsException
from shared.exceptions import NotFoundException


async def get_current_vendor(
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
    user: User = Depends(get_current_user),
):
    stmt = select(User).where(User.id == user.id).options(selectinload(User.vendor_profile))
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    return user.vendor_profile


async def ensure_no_vendor_profile(
    user: User,
    session: AsyncSession,
):
    vendor = await get_vendor_profile(session, user.id)
    if vendor:
        raise VendorAlreadyExistsException()


async def get_vendor_or_404(
    user: User,
    session: AsyncSession,
):
    vendor = await get_vendor_profile(session, user.id)
    if not vendor:
        raise NotFoundException
    return vendor
