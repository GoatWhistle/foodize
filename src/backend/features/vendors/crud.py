import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from features.users.models import User
from features.vendors.exceptions import VendorProfileNotFoundException
from features.vendors.models import VendorProfile
from shared.enums.moderation_status import ModerationStatus
from shared.enums.permissions import Permission
from shared.permissions import has_permission


async def create_vendor_profile(session: AsyncSession, user: User) -> VendorProfile:
    vendor = VendorProfile(user=user, user_id=user.id)
    if has_permission(user.permissions, Permission.VENDORS_MODERATE):
        vendor.approval_status = ModerationStatus.APPROVED.value
    session.add(vendor)
    await session.flush()
    return vendor


async def get_vendor_by_user_id(session: AsyncSession, user_id: uuid.UUID) -> VendorProfile | None:
    result = await session.execute(select(VendorProfile).where(VendorProfile.user_id == user_id))
    return result.scalar_one_or_none()


async def get_vendor_by_id_with_user(
    session: AsyncSession, vendor_id: uuid.UUID
) -> VendorProfile | None:
    result = await session.execute(
        select(VendorProfile)
        .where(VendorProfile.id == vendor_id)
        .options(selectinload(VendorProfile.user))
    )
    return result.scalar_one_or_none()


async def get_vendor_by_user_id_or_404(session: AsyncSession, user_id: uuid.UUID) -> VendorProfile:
    vendor = await get_vendor_by_user_id(session, user_id)
    if not vendor:
        raise VendorProfileNotFoundException()
    return vendor
