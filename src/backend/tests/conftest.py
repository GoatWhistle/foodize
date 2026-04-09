import os
import sys
from unittest.mock import AsyncMock

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from database.db_helper import db_helper
from main import app


@pytest_asyncio.fixture(scope="function")
async def mock_db_session():
    session = AsyncMock()
    yield session


@pytest_asyncio.fixture(scope="function")
async def client(mock_db_session):
    async def override_get_session():
        yield mock_db_session

    app.dependency_overrides[db_helper.dependency_session_getter] = override_get_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as test_client:
        yield test_client
    app.dependency_overrides.clear()
