from sqlalchemy.ext.asyncio import AsyncSession

from features.users.models import User
from features.vendors.crud import (
    create_vendor_profile,
    get_vendor_by_user_id,
    update_vendor_description,
)
from features.vendors.exceptions import VendorAlreadyExistsException
from features.vendors.models import VendorProfile
from features.vendors.schemas import VendorCreate


async def register_vendor(
    session: AsyncSession, user: User, vendor_in: VendorCreate
) -> VendorProfile:
    if await get_vendor_by_user_id(session, user.id):
        raise VendorAlreadyExistsException()
    return await create_vendor_profile(session=session, user=user, vendor_in=vendor_in)


async def update_description(
    session: AsyncSession, vendor: VendorProfile, new_description: str
) -> VendorProfile:
    return await update_vendor_description(session, vendor, new_description)
