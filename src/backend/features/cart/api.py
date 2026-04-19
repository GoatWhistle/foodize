from fastapi import APIRouter, Depends, status

from features.auth.service import get_current_user
from features.users.models import User

from .schemas import CartResponse, CartUpdate
from .service import CartService, get_cart_service

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("", response_model=CartResponse)
async def get_cart(
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
):
    return await service.get_cart(current_user.id)


@router.post("")
async def update_cart(
    cart_in: CartUpdate,
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
):
    await service.update_cart(current_user.id, cart_in)
    return {"status": "success"}


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
):
    await service.clear_cart(current_user.id)
