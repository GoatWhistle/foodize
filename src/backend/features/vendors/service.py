from sqlalchemy.ext.asyncio import AsyncSession

from features import User
from features.vendors.crud import create_vendors_profile
from features.vendors.dependencies import ensure_no_vendor_profile
from features.vendors.schemas import CreateVendor


async def add_vendors_profile(
        session: AsyncSession,
        user: User,
        vendor_in : CreateVendor
):
    await ensure_no_vendor_profile(user, session)
    vendors_profile = await create_vendors_profile(session=session, user=user,vendor_in=vendor_in)
    return vendors_profile