import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.users.models import User
from features.vendors.models import VendorProfile
from features.vendors.schemas import VendorCreate
from shared.exceptions import NotFoundException


async def create_vendor_profile(
    session: AsyncSession, user: User, vendor_in: VendorCreate
) -> VendorProfile:
    vendor = VendorProfile(user=user, user_id=user.id)
    session.add(vendor)
    await session.commit()
    return vendor


async def get_vendor_by_user_id(
    session: AsyncSession, user_id: uuid.UUID
) -> VendorProfile | None:
    result = await session.execute(
        select(VendorProfile).where(VendorProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_vendor_by_user_id_or_404(
    session: AsyncSession, user_id: uuid.UUID
) -> VendorProfile:
    vendor = await get_vendor_by_user_id(session, user_id)
    if not vendor:
        raise NotFoundException()
    return vendor
