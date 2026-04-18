import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth.service import get_current_user
from features.staff import service
from features.staff.dependencies import get_valid_staff_request
from features.staff.models import StaffRequest
from features.staff.schemas import (
    StaffRequestCreate,
    StaffRequestResponse,
    StaffRequestStatusUpdate,
)
from features.users.models import User
from features.vendors.dependencies import get_current_vendor
from features.vendors.models import VendorProfile
from shared.response import build_list_response
from shared.schemas.response import SuccessListResponse

router = APIRouter(prefix="/staff", tags=["Staff"])


@router.post("/requests/{restaurant_id}", response_model=StaffRequestResponse)
async def create_staff_request(
    restaurant_id: uuid.UUID,
    request_in: StaffRequestCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> StaffRequestResponse:
    return await service.create_staff_request(
        session=session,
        user_id=current_user.id,
        restaurant_id=restaurant_id,
        request_data=request_in,
    )


@router.patch("/requests/{request_id}/status", response_model=StaffRequestResponse)
async def update_staff_status(
    status_update: StaffRequestStatusUpdate,
    request: StaffRequest = Depends(get_valid_staff_request),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> StaffRequestResponse | None:
    return await service.process_staff_request(
        session=session, request=request, new_status=status_update.status
    )


@router.get("/my-requests", response_model=SuccessListResponse[StaffRequestResponse])
async def get_vendor_requests(
    request: Request,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessListResponse[StaffRequestResponse]:
    data, total = await service.get_vendor_staff_requests(
        session=session, vendor_id=current_vendor.id, page=page, size=size
    )
    return build_list_response(data=data, total=total, page=page, size=size, request=request)
