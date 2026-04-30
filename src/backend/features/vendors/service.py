from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.crud import get_finance_analytics
from features.admin.schemas import FinanceAnalytics
from features.users.models import User
from features.vendors import crud
from features.vendors.exceptions import VendorAlreadyExistsException
from features.vendors.models import VendorProfile
from features.vendors.schemas import VendorCreate, VendorResponse


async def register_vendor(
    session: AsyncSession, user: User, vendor_in: VendorCreate
) -> VendorResponse:
    if await crud.get_vendor_by_user_id(session, user.id):
        raise VendorAlreadyExistsException()
    vendor = await crud.create_vendor_profile(session=session, user=user, vendor_in=vendor_in)
    return VendorResponse.model_validate(vendor)


async def update_description(
    session: AsyncSession, vendor: VendorProfile, new_description: str
) -> VendorResponse:
    updated = await crud.update_vendor_description(session, vendor, new_description)
    return VendorResponse.model_validate(updated)


async def get_vendor_finance(
    session: AsyncSession,
    vendor: VendorProfile,
    date_from: date | None = None,
    date_to: date | None = None,
) -> FinanceAnalytics:
    return await get_finance_analytics(
        session,
        date_from=date_from,
        date_to=date_to,
        vendor_id=vendor.id,
    )
