from sqlalchemy.ext.asyncio import AsyncSession

from features import User
from features.vendors.schemas import CreateVendor
from features import VendorProfile
from shared.exceptions import NotFoundException


async def create_vendors_profile(
        session: AsyncSession,
        user: User,
        vendor_in: CreateVendor

):
    vendor = VendorProfile(
        user=user,
        user_id=user.id,
        **vendor_in.model_dump()
    )
    session.add(vendor)
    await session.commit()
    return vendor


async def get_vendor_profile(session: AsyncSession, user_id: int):
    return await session.get(VendorProfile, user_id)


async def get_vendor_profile_or_404(session: AsyncSession, user_id: int):
    vendor = await get_vendor_profile(session, user_id)
    if not vendor:
        raise NotFoundException
    return vendor
