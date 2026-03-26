import os
import sys
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock

# Add src/backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

from database.db_helper import db_helper

@pytest_asyncio.fixture(scope="function")
async def mock_db_session():
    # Returns an AsyncMock that can be configured by individual tests
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
