from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth.service import get_current_user
from features.users.models import User
from features.vendors import service
from features.vendors.dependencies import get_current_vendor
from features.vendors.models import VendorProfile
from features.vendors.schemas import VendorCreate, VendorDescriptionUpdate, VendorResponse
from shared.response import build_response
from shared.schemas.response import SuccessResponse

router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.post(
    "/", response_model=SuccessResponse[VendorResponse], status_code=status.HTTP_201_CREATED
)
async def create_vendor(
    vendor_in: VendorCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[VendorResponse]:
    result = await service.register_vendor(user=user, session=session, vendor_in=vendor_in)
    return build_response(result)


@router.get("/", response_model=SuccessResponse[VendorResponse])
async def read_my_vendor_profile(
    current_vendor: VendorProfile = Depends(get_current_vendor),
) -> SuccessResponse[VendorResponse]:
    return build_response(VendorResponse.model_validate(current_vendor))


@router.patch("/description", response_model=SuccessResponse[VendorResponse])
async def update_description(
    body: VendorDescriptionUpdate,
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[VendorResponse]:
    result = await service.update_description(
        new_description=body.description, vendor=current_vendor, session=session
    )
    return build_response(result)
