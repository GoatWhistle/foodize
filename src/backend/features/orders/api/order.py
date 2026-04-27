import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth.service import get_current_user
from features.orders.crud.order import get_order_by_id
from features.orders.dependencies import (
    get_order_for_staff_or_vendor,
    get_restaurant_staff_or_vendor,
    verify_restaurant_access,
)
from features.orders.models import Order
from features.orders.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from features.orders.schemas.order_event import OrderEventResponse
from features.orders.services import order as service
from features.restaurants.models import Restaurant
from features.users.models import User
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole
from shared.exceptions import AccessDeniedException, NotFoundException
from shared.response import build_list_response, build_response
from shared.schemas.response import SuccessListResponse, SuccessResponse

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post(
    "/", response_model=SuccessResponse[OrderResponse], status_code=status.HTTP_201_CREATED
)
async def create_order(
    order_in: OrderCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[OrderResponse]:
    result = await service.place_order(
        session=session, order_data=order_in, user_id=current_user.id
    )
    return build_response(result)


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


@router.patch("/{order_id}/status", response_model=SuccessResponse[OrderResponse])
async def update_order_status(
    status_in: OrderStatusUpdate,
    order: Order = Depends(get_order_for_staff_or_vendor),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[OrderResponse]:
    result = await service.change_order_status(
        session=session, order=order, status_data=status_in, actor=current_user
    )
    return build_response(result)


@router.get("/{order_id}/events", response_model=SuccessListResponse[OrderEventResponse])
async def read_order_events(
    request: Request,
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessListResponse[OrderEventResponse]:
    order = await get_order_by_id(session, order_id)
    if not order:
        raise NotFoundException(detail="Order not found")

    if current_user.user_role == UserRole.CUSTOMER.value:
        if order.user_id != current_user.id:
            raise AccessDeniedException()
    else:
        await verify_restaurant_access(session, order.restaurant_id, current_user)

    events = await service.get_order_events(session=session, order_id=order.id)
    return build_list_response(
        data=events, total=len(events), page=1, size=len(events) or 1, request=request
    )


@router.post("/{order_id}/complete", response_model=SuccessResponse[OrderResponse])
async def complete_order(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[OrderResponse]:
    result = await service.complete_order(
        session=session, order_id=order_id, user_id=current_user.id
    )
    return build_response(result)


@router.post("/{order_id}/cancel", response_model=SuccessResponse[OrderResponse])
async def cancel_order(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[OrderResponse]:
    result = await service.cancel_order(session=session, order_id=order_id, user_id=current_user.id)
    return build_response(result)


@router.get("/{order_id}", response_model=SuccessResponse[OrderResponse])
async def read_order(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[OrderResponse]:
    order = await get_order_by_id(session, order_id)
    if not order:
        raise NotFoundException(detail="Order not found")

    if current_user.user_role == UserRole.CUSTOMER.value:
        if order.user_id != current_user.id:
            raise AccessDeniedException()
    else:
        await verify_restaurant_access(session, order.restaurant_id, current_user)

    return build_response(OrderResponse.model_validate(order))
