from sqlalchemy.ext.asyncio import AsyncSession

from features import User, VendorProfile
from features.vendors.crud import create_vendors_profile, update_description
from features.vendors.dependencies import ensure_no_vendor_profile
from features.vendors.schemas import CreateVendor


async def add_vendors_profile(session: AsyncSession, user: User, vendor_in: CreateVendor):
    await ensure_no_vendor_profile(user, session)
    vendors_profile = await create_vendors_profile(session=session, user=user, vendor_in=vendor_in)
    return vendors_profile


async def update_vendor_details(session: AsyncSession, vendor: VendorProfile, new_description: str):
    return await update_description(session, vendor, new_description)
