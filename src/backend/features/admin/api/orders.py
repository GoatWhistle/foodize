import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.admin.api.schemas import ForceCancelOrderRequest
from features.admin.dependencies import require_admin
from features.orders.schemas.order import OrderResponse
from features.orders.services import order_status
from features.users.models import User
from shared.response import build_response
from shared.schemas.response import SuccessResponse

router = APIRouter()


@router.post("/orders/{order_id}/cancel", response_model=SuccessResponse[OrderResponse])
async def force_cancel_order(
    order_id: uuid.UUID,
    body: ForceCancelOrderRequest,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[OrderResponse]:
    result = await order_status.force_cancel_order(session, order_id, actor, body.reason)
    return build_response(result)
