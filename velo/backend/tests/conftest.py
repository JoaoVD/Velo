import pytest
from unittest.mock import MagicMock, patch
from httpx import AsyncClient, ASGITransport


@pytest.fixture
def mock_supabase():
    """Mock Supabase client so tests don't need real credentials."""
    with patch("app.database._supabase", MagicMock()):
        yield


@pytest.fixture
async def client(mock_supabase):
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
