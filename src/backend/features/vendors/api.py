from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth.service import get_current_user
from features.users.models import User
from features.vendors import service
from features.vendors.dependencies import get_current_vendor
from features.vendors.models import VendorProfile
from features.vendors.schemas import VendorCreate, VendorResponse

router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.post("/", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor(
    vendor_in: VendorCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> VendorProfile:
    return await service.register_vendor(user=user, session=session, vendor_in=vendor_in)


@router.get("/", response_model=VendorResponse)
async def read_my_vendor_profile(
    current_vendor: VendorProfile = Depends(get_current_vendor),
) -> VendorProfile:
    return current_vendor


@router.patch("/description", response_model=VendorResponse)
async def update_description(
    new_description: str,
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> VendorProfile:
    return await service.update_description(
        new_description=new_description, vendor=current_vendor, session=session
    )
