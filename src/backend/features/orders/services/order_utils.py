import hashlib
import json
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.models import MenuItem, MenuItemOption
from features.orders.exceptions import InvalidStatusTransitionException
from features.orders.models import IdempotencyKey
from features.orders.schemas.order import OrderCreate
from features.restaurants.working_hours_crud import is_open_now
from infra.cache.redis import get_redis_cache
from shared.enums.order_status import OrderStatus
from shared.enums.selection_type import SelectionType
from shared.exceptions import BadRequestException
from utils.logging_setup import get_logger

logger = get_logger(__name__)

ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PENDING: {OrderStatus.ACCEPTED},
    OrderStatus.ACCEPTED: {OrderStatus.READY},
    OrderStatus.READY: {OrderStatus.COMPLETED},
    OrderStatus.COMPLETED: set(),
    OrderStatus.CANCELLED: set(),
}

CANCELLABLE_STATUSES = {OrderStatus.PENDING, OrderStatus.ACCEPTED}
TERMINAL_STATUSES = {OrderStatus.COMPLETED, OrderStatus.CANCELLED}
_PICKUP_TIME_HORIZON_DAYS = 7


async def safe_publish(channel: str, message: str) -> None:
    try:
        await get_redis_cache().publish(channel, message)
    except Exception:
        logger.warning("redis_publish_failed", channel=channel)


def is_ordering_paused(restaurant) -> bool:
    if getattr(restaurant, "is_ordering_paused", False) is not True:
        return False
    paused_until = restaurant.ordering_paused_until
    if paused_until is None:
        return True
    if paused_until.tzinfo is None:
        paused_until = paused_until.replace(tzinfo=timezone.utc)
    return paused_until > datetime.now(timezone.utc)


def validate_transition(old: OrderStatus, new: OrderStatus) -> None:
    if new not in ALLOWED_TRANSITIONS.get(old, set()):
        raise InvalidStatusTransitionException()


def validate_item_options(
    item_data,
    menu_item: MenuItem,
    options_by_id: dict[uuid.UUID, MenuItemOption],
) -> list[MenuItemOption]:
    selected_ids = item_data.selected_option_ids
    if len(selected_ids) != len(set(selected_ids)):
        raise BadRequestException(detail="Duplicate options selected")

    selected_options: list[MenuItemOption] = []
    selected_by_group: dict[uuid.UUID, int] = {}

    for option_id in selected_ids:
        option = options_by_id.get(option_id)
        if not option:
            raise BadRequestException(detail="Selected option not found")
        if option.group.menu_item_id != menu_item.id:
            raise BadRequestException(detail="Selected option does not belong to menu item")
        if not option.group.is_active or not option.is_available:
            raise BadRequestException(detail="Selected option is not available")
        selected_options.append(option)
        selected_by_group[option.group_id] = selected_by_group.get(option.group_id, 0) + 1

    for group in menu_item.option_groups:
        if not group.is_active:
            continue
        selected_count = selected_by_group.get(group.id, 0)
        min_selected = group.min_selected
        if group.is_required:
            min_selected = max(1, min_selected)
        if selected_count < min_selected:
            raise BadRequestException(detail=f"Not enough options selected for {group.name}")
        if group.max_selected is not None and selected_count > group.max_selected:
            raise BadRequestException(detail=f"Too many options selected for {group.name}")
        if group.selection_type == SelectionType.SINGLE.value and selected_count > 1:
            raise BadRequestException(detail=f"Only one option can be selected for {group.name}")

    return selected_options


def make_request_hash(order_data: OrderCreate) -> str:
    payload = order_data.model_dump(mode="json")
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode()).hexdigest()


def as_aware_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def validate_requested_pickup_at(
    requested_pickup_at: datetime | None,
    min_ready_at: datetime,
) -> datetime | None:
    if requested_pickup_at is None:
        return None
    pickup_at = as_aware_utc(requested_pickup_at)
    now = datetime.now(timezone.utc)
    latest = now + timedelta(days=_PICKUP_TIME_HORIZON_DAYS)
    if pickup_at < min_ready_at:
        raise BadRequestException(detail="Pickup time is too soon for the current restaurant load")
    if pickup_at > latest:
        raise BadRequestException(
            detail=f"Pickup time must be within {_PICKUP_TIME_HORIZON_DAYS} days"
        )
    return pickup_at


def is_open_at(hours, value: datetime) -> bool | None:
    if not hours:
        return None
    return is_open_now(hours, as_aware_utc(value))


async def get_idempotency_record(
    session: AsyncSession,
    user_id: uuid.UUID,
    key: str,
) -> IdempotencyKey | None:
    result = await session.execute(
        select(IdempotencyKey).where(
            IdempotencyKey.user_id == user_id,
            IdempotencyKey.key == key,
        )
    )
    return result.scalar_one_or_none()


async def start_idempotency_record(
    session: AsyncSession,
    user_id: uuid.UUID,
    key: str | None,
    request_hash: str,
) -> IdempotencyKey | None:
    if not key:
        return None

    stmt = (
        pg_insert(IdempotencyKey)
        .values(user_id=user_id, key=key, request_hash=request_hash)
        .on_conflict_do_nothing(index_elements=["user_id", "key"])
        .returning(IdempotencyKey)
    )
    result = await session.execute(stmt)
    record = result.scalar_one_or_none()
    if record is not None:
        return record

    existing = await get_idempotency_record(session, user_id, key)
    if existing is None:
        raise BadRequestException(detail="Idempotent request is still being processed")
    if existing.request_hash != request_hash:
        raise BadRequestException(detail="Idempotency key was used with different payload")
    if existing.response_json:
        return existing
    raise BadRequestException(detail="Idempotent request is still being processed")
