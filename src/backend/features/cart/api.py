from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.users.models import User
from shared.dependencies import require_permission
from shared.enums.permissions import Permission
from shared.response import build_response
from shared.schemas.response import SuccessResponse

from .schemas import CartResponse, CartUpdate
from .service import CartService, get_cart_service

router = APIRouter(prefix="/cart", tags=["Cart"])


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
    result = await cart_service.get_cart(str(current_user.id))
    return build_response(result)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    current_user: User = Depends(require_permission(Permission.CART_MANAGE)),
    cart_service: CartService = Depends(get_cart_service),
) -> None:
    await cart_service.clear_cart(str(current_user.id))
