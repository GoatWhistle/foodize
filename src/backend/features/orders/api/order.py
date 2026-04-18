import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth.service import get_current_user
from features.orders.crud.order import get_events_by_order_id
from features.orders.dependencies import (
    get_order_for_staff_or_vendor,
    get_restaurant_staff_or_vendor,
)
from features.orders.models import Order, OrderEvent
from features.orders.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from features.orders.schemas.order_event import OrderEventResponse
from features.orders.services import order as service
from features.restaurants.models import Restaurant
from features.users.models import User
from shared.enums.order_status import OrderStatus
from shared.response import build_list_response
from shared.schemas.response import SuccessListResponse

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> Order:
    return await service.place_order(session=session, order_data=order_in, user_id=current_user.id)


@router.get("/me", response_model=SuccessListResponse[OrderResponse])
async def read_my_orders(
    request: Request,
    status: OrderStatus | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessListResponse[OrderResponse]:
    data, total = await service.get_user_orders(
        session=session, user_id=current_user.id, status=status, page=page, size=size
    )
    return build_list_response(data=data, total=total, page=page, size=size, request=request)


@router.get("/restaurant/{restaurant_id}", response_model=SuccessListResponse[OrderResponse])
async def read_restaurant_orders(
    request: Request,
    status: OrderStatus | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    restaurant: Restaurant = Depends(get_restaurant_staff_or_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessListResponse[OrderResponse]:
    data, total = await service.get_restaurant_orders(
        session=session, restaurant_id=restaurant.id, status=status, page=page, size=size
    )
    return build_list_response(data=data, total=total, page=page, size=size, request=request)


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    status_in: OrderStatusUpdate,
    order: Order = Depends(get_order_for_staff_or_vendor),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> Order:
    return await service.change_order_status(
        session=session, order=order, status_data=status_in, actor=current_user
    )


@router.get("/{order_id}/events", response_model=list[OrderEventResponse])
async def read_order_events(
    order: Order = Depends(get_order_for_staff_or_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> list[OrderEvent]:
    return await get_events_by_order_id(session=session, order_id=order.id)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def update_order_cancel(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> Order:
    order = await service.get_order_for_user(
        session=session, order_id=order_id, user_id=current_user.id
    )
    return await service.cancel_customer_order(
        session=session, order=order, user_id=current_user.id
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def read_order(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> Order:
    return await service.get_order_for_user(
        session=session, order_id=order_id, user_id=current_user.id
    )
