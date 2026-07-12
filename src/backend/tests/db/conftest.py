import os
from collections.abc import AsyncGenerator

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from database import Base

_TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "sqlite+aiosqlite:///:memory:")

if _TEST_DATABASE_URL.startswith("sqlite"):
    engine = create_async_engine(_TEST_DATABASE_URL, echo=False, poolclass=StaticPool)
else:
    engine = create_async_engine(_TEST_DATABASE_URL, echo=False)

TestingSessionLocal = async_sessionmaker(
    expire_on_commit=False, autocommit=False, autoflush=False, bind=engine
)


@pytest_asyncio.fixture(loop_scope="function", autouse=True)
async def setup_test_db() -> AsyncGenerator[None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession]:
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()
