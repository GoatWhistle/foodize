import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features import StaffRequest, User, VendorProfile
from features.auth.service import get_current_user
from features.staff import service
from features.staff.dependencies import get_valid_staff_request
from features.staff.schemas import (
    StaffRequestCreate,
    StaffRequestResponse,
    StaffRequestStatusUpdate,
)
from features.vendors.dependencies import get_current_vendor

router = APIRouter(prefix="/staff", tags=["Staff"])


@router.post(
    "/requests/{restaurant_id}",
    response_model=StaffRequestResponse,
)
async def apply_for_job(
    restaurant_id: uuid.UUID,
    request_in: StaffRequestCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await service.create_new_staff_request(
        session=session,
        user_id=current_user.id,
        restaurant_id=restaurant_id,
        request_data=request_in,
    )


@router.patch("/requests/{request_id}/status", response_model=StaffRequestResponse)
async def update_request_status(
    status_update: StaffRequestStatusUpdate,
    request: StaffRequest = Depends(get_valid_staff_request),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await service.process_staff_request(
        session=session, request_id=request.id, new_status=status_update.status
    )


@router.get("/my-requests", response_model=list[StaffRequestResponse])
async def get_vendor_requests(
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await service.get_vendor_staff_requests(session=session, vendor_id=current_vendor.id)
