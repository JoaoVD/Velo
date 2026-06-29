import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from uuid import uuid4
from app.auth import get_current_user

BRAND_ID = str(uuid4())
KW_ID = str(uuid4())
USER_ID = str(uuid4())
MOCK_USER = MagicMock(id=USER_ID, email="test@test.com")
MOCK_KW = {
    "id": KW_ID,
    "brand_id": BRAND_ID,
    "term": "advogado trabalhista SP",
    "created_at": "2026-06-28T00:00:00+00:00",
}
AUTH_HEADERS = {"Authorization": "Bearer fake-token"}


@pytest.mark.asyncio
async def test_list_keywords_empty(client):
    from app.main import app

    async def override_get_current_user():
        return MOCK_USER

    app.dependency_overrides[get_current_user] = override_get_current_user

    with patch("app.routers.keywords.supabase_client") as mock_db:
        mock_db.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        response = await client.get(f"/brands/{BRAND_ID}/keywords", headers=AUTH_HEADERS)

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_keyword(client):
    from app.main import app

    async def override_get_current_user():
        return MOCK_USER

    app.dependency_overrides[get_current_user] = override_get_current_user

    with patch("app.routers.keywords.supabase_client") as mock_db:
        # First call: existing count (0 keywords)
        # Second call: insert
        mock_db.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        mock_db.return_value.table.return_value.insert.return_value.execute.return_value.data = [MOCK_KW]
        response = await client.post(
            f"/brands/{BRAND_ID}/keywords",
            json={"term": "advogado trabalhista SP"},
            headers=AUTH_HEADERS,
        )

    app.dependency_overrides.clear()
    assert response.status_code == 201
    assert response.json()["term"] == "advogado trabalhista SP"


@pytest.mark.asyncio
async def test_create_keyword_limit_exceeded(client):
    from app.main import app

    async def override_get_current_user():
        return MOCK_USER

    app.dependency_overrides[get_current_user] = override_get_current_user

    with patch("app.routers.keywords.supabase_client") as mock_db:
        # Already 10 keywords
        mock_db.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{}] * 10
        response = await client.post(
            f"/brands/{BRAND_ID}/keywords",
            json={"term": "nova keyword"},
            headers=AUTH_HEADERS,
        )

    app.dependency_overrides.clear()
    assert response.status_code == 400
    assert "Limite" in response.json()["detail"]
