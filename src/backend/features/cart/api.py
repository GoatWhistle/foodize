from http import HTTPStatus

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.ai_order_agent.tool_helpers import order_confirm_key
from features.users.models import User
from infra.cache.redis import get_redis_cache
from shared.dependencies import require_permission
from shared.enums.permissions import Permission
from shared.response import build_response
from shared.schemas.response import SuccessResponse

from .schemas import CartResponse, CartUpdate
from .service import CartService, get_cart_service

router = APIRouter(prefix="/cart", tags=["Cart"])


async def _invalidate_order_confirm(identifier: str) -> None:
    await get_redis_cache().delete(order_confirm_key(identifier))


@router.get("", response_model=SuccessResponse[CartResponse])
async def get_cart(
    current_user: User = Depends(require_permission(Permission.CART_MANAGE)),
    cart_service: CartService = Depends(get_cart_service),
) -> SuccessResponse[CartResponse]:
    result = await cart_service.get_cart(str(current_user.id))
    return build_response(result)


@router.post("", response_model=SuccessResponse[CartResponse])
async def update_cart(
    cart_in: CartUpdate,
    current_user: User = Depends(require_permission(Permission.CART_MANAGE)),
    cart_service: CartService = Depends(get_cart_service),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[CartResponse]:
    await cart_service.update_cart(str(current_user.id), cart_in, session=session)
    await _invalidate_order_confirm(str(current_user.id))
    result = await cart_service.get_cart(str(current_user.id))
    return build_response(result)


@router.delete("", status_code=HTTPStatus.NO_CONTENT)
async def clear_cart(
    current_user: User = Depends(require_permission(Permission.CART_MANAGE)),
    cart_service: CartService = Depends(get_cart_service),
) -> None:
    await cart_service.clear_cart(str(current_user.id))
    await _invalidate_order_confirm(str(current_user.id))
