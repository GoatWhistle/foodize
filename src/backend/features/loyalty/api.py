import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.loyalty import crud as loyalty_crud
from features.loyalty import service
from features.loyalty.schemas import (
    LoyaltyProgramResponse,
    LoyaltyProgramUpsert,
    LoyaltyStatusResponse,
)
from features.users.models import User
from features.vendors.dependencies import get_current_vendor
from features.vendors.models import VendorProfile
from settings.config.app_config import settings
from shared.dependencies import require_permission
from shared.enums.permissions import Permission
from shared.response import build_response
from shared.schemas.response import SuccessResponse

router = APIRouter(prefix=settings.api.v1.loyalty.prefix, tags=[settings.api.v1.loyalty.tag])


@router.get("/programs/{restaurant_id}", response_model=SuccessResponse[LoyaltyProgramResponse])
async def get_program(
    restaurant_id: uuid.UUID,
    _user: User = Depends(require_permission(Permission.LOYALTY_MANAGE)),
    vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[LoyaltyProgramResponse]:
    restaurant_ids = await loyalty_crud.get_restaurant_ids_by_vendor(session, vendor.id)
    result = await service.get_vendor_program(session, restaurant_id, restaurant_ids)
    return build_response(result)


@router.put("/programs/{restaurant_id}", response_model=SuccessResponse[LoyaltyProgramResponse])
async def upsert_program(
    restaurant_id: uuid.UUID,
    data: LoyaltyProgramUpsert,
    _user: User = Depends(require_permission(Permission.LOYALTY_MANAGE)),
    vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[LoyaltyProgramResponse]:
    restaurant_ids = await loyalty_crud.get_restaurant_ids_by_vendor(session, vendor.id)
    result = await service.upsert_program(
        session, restaurant_id, data, restaurant_ids, actor_id=_user.id
    )
    return build_response(result)


@router.get(
    "/restaurants/{restaurant_id}/status",
    response_model=SuccessResponse[LoyaltyStatusResponse],
)
async def get_status(
    restaurant_id: uuid.UUID,
    user: User = Depends(require_permission(Permission.LOYALTY_READ)),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[LoyaltyStatusResponse]:
    result = await service.get_status(session, restaurant_id, user.id)
    return build_response(result)
