import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from features.ai_order_agent.models import MenuItemEmbedding
from features.menu.models import MenuItem
from features.restaurants.models import Restaurant
from shared.enums.moderation_status import ModerationStatus


def _orderable_filters(max_price: int | None, restaurant_id: uuid.UUID | None) -> list:
    filters = [
        MenuItem.is_available.is_(True),
        MenuItem.is_deleted.is_(False),
        Restaurant.is_active.is_(True),
        Restaurant.moderation_status == ModerationStatus.APPROVED.value,
    ]
    if max_price is not None:
        filters.append(MenuItem.price <= max_price)
    if restaurant_id is not None:
        filters.append(MenuItem.restaurant_id == restaurant_id)
    return filters


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _row_to_dict(row) -> dict:
    return {
        "menu_item_id": str(row.id),
        "name": row.name,
        "description": row.description,
        "price": row.price,
        "category": row.category,
        "restaurant_id": str(row.restaurant_id),
        "restaurant_name": row.restaurant_name,
        "restaurant_address": row.restaurant_address,
    }


_SELECT_COLUMNS = (
    MenuItem.id,
    MenuItem.name,
    MenuItem.description,
    MenuItem.price,
    MenuItem.category,
    MenuItem.restaurant_id,
    Restaurant.name.label("restaurant_name"),
    Restaurant.address.label("restaurant_address"),
)


async def list_orderable_items(
    session: AsyncSession,
    *,
    max_price: int | None = None,
    restaurant_id: uuid.UUID | None = None,
    limit: int = 300,
) -> list[dict]:
    stmt = (
        select(*_SELECT_COLUMNS)
        .join(Restaurant, Restaurant.id == MenuItem.restaurant_id)
        .where(*_orderable_filters(max_price, restaurant_id))
        .order_by(MenuItem.created_at.desc())
        .limit(limit)
    )
    rows = await session.execute(stmt)
    return [_row_to_dict(row) for row in rows.all()]


async def search_menu_items(
    session: AsyncSession,
    *,
    query: str | None = None,
    max_price: int | None = None,
    restaurant_id: uuid.UUID | None = None,
    limit: int = 15,
) -> list[dict]:
    filters = _orderable_filters(max_price, restaurant_id)
    if query:
        pattern = f"%{_escape_like(query.strip())}%"
        filters.append(
            or_(
                MenuItem.name.ilike(pattern, escape="\\"),
                MenuItem.description.ilike(pattern, escape="\\"),
            )
        )

    stmt = (
        select(*_SELECT_COLUMNS)
        .join(Restaurant, Restaurant.id == MenuItem.restaurant_id)
        .where(*filters)
        .order_by(MenuItem.price.asc(), MenuItem.name.asc())
        .limit(limit)
    )
    rows = await session.execute(stmt)
    return [_row_to_dict(row) for row in rows.all()]


async def get_embedding_meta(
    session: AsyncSession,
    item_ids: list[uuid.UUID],
    model: str,
) -> dict[uuid.UUID, str]:
    if not item_ids:
        return {}
    stmt = select(MenuItemEmbedding.menu_item_id, MenuItemEmbedding.text_hash).where(
        MenuItemEmbedding.menu_item_id.in_(item_ids),
        MenuItemEmbedding.model == model,
    )
    rows = await session.execute(stmt)
    return {row.menu_item_id: row.text_hash for row in rows.all()}


async def upsert_embeddings(session: AsyncSession, rows: list[dict]) -> None:
    if not rows:
        return
    stmt = pg_insert(MenuItemEmbedding).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=[MenuItemEmbedding.menu_item_id],
        set_={
            "model": stmt.excluded.model,
            "text_hash": stmt.excluded.text_hash,
            "embedding": stmt.excluded.embedding,
            "updated_at": func.now(),
        },
    )
    await session.execute(stmt)
    await session.commit()


async def semantic_rank_items(
    session: AsyncSession,
    *,
    query_embedding: list[float],
    model: str,
    max_price: int | None = None,
    restaurant_id: uuid.UUID | None = None,
    limit: int = 50,
) -> list[dict]:
    distance = MenuItemEmbedding.embedding.cosine_distance(query_embedding).label("distance")
    stmt = (
        select(*_SELECT_COLUMNS, distance)
        .join(Restaurant, Restaurant.id == MenuItem.restaurant_id)
        .join(MenuItemEmbedding, MenuItemEmbedding.menu_item_id == MenuItem.id)
        .where(*_orderable_filters(max_price, restaurant_id), MenuItemEmbedding.model == model)
        .order_by(distance.asc())
        .limit(limit)
    )
    rows = await session.execute(stmt)
    results = []
    for row in rows.all():
        item = _row_to_dict(row)
        item["_distance"] = float(row.distance)
        results.append(item)
    return results
