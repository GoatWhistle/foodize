import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth.service import get_current_user
from features.orders.schemas import OrderCreate, OrderResponse
from features.orders.service import get_order_for_user, get_user_orders, place_order
from features.users.models import User

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await place_order(
        session=session,
        order_data=order_in,
        user_id=current_user.id,
    )


@router.get("/me", response_model=list[OrderResponse])
async def get_my_orders(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await get_user_orders(session=session, user_id=current_user.id)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await get_order_for_user(
        session=session,
        order_id=order_id,
        user_id=current_user.id,
    )
