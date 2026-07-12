import json
import logging
from collections.abc import AsyncGenerator, Awaitable, Callable
from enum import Enum

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from settings.config.app_config import settings

_logger = logging.getLogger(__name__)
_AFTER_COMMIT_KEY = "after_commit_callbacks"

AfterCommitCallback = Callable[[], Awaitable[None]]


def register_after_commit(session: AsyncSession, callback: AfterCommitCallback) -> None:
    session.info.setdefault(_AFTER_COMMIT_KEY, []).append(callback)


async def run_after_commit_callbacks(session: AsyncSession) -> None:
    callbacks: list[AfterCommitCallback] = session.info.pop(_AFTER_COMMIT_KEY, [])
    for callback in callbacks:
        try:
            await callback()
        except Exception:
            _logger.exception("after_commit_callback_failed")


def _json_fallback(obj: object) -> str:
    if isinstance(obj, Enum):
        return str(obj.value)
    return str(obj)


def _json_serializer(obj: object) -> str:
    return json.dumps(obj, default=_json_fallback, ensure_ascii=False)


class DbHelper:
    def __init__(
        self,
        url: str,
        echo: bool | None = None,
        echo_pool: bool | None = None,
        max_overflow: int | None = None,
        pool_size: int | None = None,
    ):
        self.engine: AsyncEngine = create_async_engine(
            url=url,
            echo=echo if echo is not None else settings.db.echo,
            echo_pool=echo_pool if echo_pool is not None else settings.db.echo_pool,
            max_overflow=max_overflow if max_overflow is not None else settings.db.max_overflow,
            pool_size=pool_size if pool_size is not None else settings.db.pool_size,
            pool_pre_ping=True,
            pool_recycle=3600,
            json_serializer=_json_serializer,
            connect_args={
                "timeout": 10,
                "command_timeout": 30,
            },
        )
        self.session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
            bind=self.engine,
            autoflush=False,
            autocommit=False,
            expire_on_commit=False,
        )

    async def dispose(self) -> None:
        await self.engine.dispose()

    async def dependency_session_getter(self) -> AsyncGenerator[AsyncSession]:
        async with self.session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            await run_after_commit_callbacks(session)


db_helper = DbHelper(url=str(settings.db.url))
