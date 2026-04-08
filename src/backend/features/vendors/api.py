from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features import User, VendorProfile
from .dependencies import get_current_vendor
from .schemas import CreateVendor
from .service import add_vendors_profile
from features.auth.service import get_current_user



router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.post("/",response_model=CreateVendor)
async def vendor(
    vendor_in : CreateVendor,
    user : User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await add_vendors_profile(user = user,session = session,vendor_in = vendor_in)

@router.get("/")
async def my_profile(
        current_vendor: VendorProfile = Depends(get_current_vendor),
):
    return current_vendor