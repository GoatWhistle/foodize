import asyncio
import importlib
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context
from database import Base
from settings.config.app_config import settings

importlib.import_module("features")

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

_MIGRATION_ONLY_INDEXES = {
    "ix_audit_logs_actor_id",
    "ix_audit_logs_entity_id",
    "ix_favorites_restaurant_id",
    "ix_idempotency_keys_order_id",
    "ix_menu_item_embeddings_embedding_hnsw",
    "ix_menu_items_restaurant_id",
    "ix_order_events_order_id",
    "ix_order_item_options_order_item_id",
    "ix_orders_promo_id",
    "ix_processed_events_created_at",
    "ix_restaurants_name_trgm",
    "ix_restaurants_vendor_id",
    "ix_reviews_restaurant_id",
    "ix_staff_profiles_restaurant_id",
    "ix_staff_requests_restaurant_id",
    "ix_staff_requests_user_id",
    "ix_users_name_trgm",
    "ix_users_permissions_gin",
    "ix_users_phone_number_trgm",
}


def include_object(
    _obj: object, name: str | None, type_: str, _reflected: bool, _compare_to: object
) -> bool:
    return not (type_ == "index" and name in _MIGRATION_ONLY_INDEXES)


def run_migrations_offline() -> None:
    db_url = str(settings.db.url)
    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_server_default=True,
        compare_type=True,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_server_default=True,
        compare_type=True,
        include_object=include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    db_url = str(settings.db.url)

    connectable = create_async_engine(
        db_url,
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
