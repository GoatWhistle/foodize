import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.admin.schemas import AdvancedAnalytics, FinanceAnalytics
from features.auth.service import get_current_user
from features.users.models import User
from features.vendors import service
from features.vendors.dependencies import get_current_vendor
from features.vendors.models import VendorProfile
from features.vendors.schemas import (
    VendorCreate,
    VendorResponse,
)
from shared.response import build_response
from shared.schemas.response import SuccessResponse

router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.post(
    "/",
    response_model=SuccessResponse[VendorResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_vendor(
    vendor_in: VendorCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[VendorResponse]:
    result = await service.register_vendor(
        user=user, session=session, vendor_in=vendor_in
    )
    return build_response(result)


@router.get("/", response_model=SuccessResponse[VendorResponse])
async def read_my_vendor_profile(
    current_vendor: VendorProfile = Depends(get_current_vendor),
) -> SuccessResponse[VendorResponse]:
    return build_response(VendorResponse.model_validate(current_vendor))


@router.get("/finance", response_model=SuccessResponse[FinanceAnalytics])
async def read_vendor_finance(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    restaurant_id: uuid.UUID | None = Query(None),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[FinanceAnalytics]:
    result = await service.get_vendor_finance(
        session=session,
        vendor=current_vendor,
        date_from=date_from,
        date_to=date_to,
        restaurant_id=restaurant_id,
    )
    return build_response(result)


@router.get("/analytics", response_model=SuccessResponse[AdvancedAnalytics])
async def read_vendor_analytics(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    restaurant_id: uuid.UUID | None = Query(None),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdvancedAnalytics]:
    result = await service.get_vendor_analytics(
        session=session,
        vendor=current_vendor,
        date_from=date_from,
        date_to=date_to,
        restaurant_id=restaurant_id,
    )
    return build_response(result)
