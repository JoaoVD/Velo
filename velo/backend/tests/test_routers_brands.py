import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from uuid import uuid4
from app.auth import get_current_user, get_user_organization_id

BRAND_ID = str(uuid4())
ORG_ID = str(uuid4())
USER_ID = str(uuid4())

MOCK_USER = MagicMock(id=USER_ID, email="test@test.com")
MOCK_BRAND = {
    "id": BRAND_ID,
    "organization_id": ORG_ID,
    "name": "Advocacia Silva",
    "website": None,
    "created_at": "2026-06-28T00:00:00+00:00",
}

AUTH_HEADERS = {"Authorization": "Bearer fake-token"}


@pytest.mark.asyncio
async def test_list_brands_empty(client):
    from app.main import app

    async def override_get_current_user():
        return MOCK_USER

    async def override_get_org_id(user=None):
        return ORG_ID

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_user_organization_id] = override_get_org_id

    with patch("app.routers.brands.supabase_client") as mock_db:
        mock_db.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        response = await client.get("/brands", headers=AUTH_HEADERS)

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_brand(client):
    from app.main import app

    async def override_get_current_user():
        return MOCK_USER

    async def override_get_org_id(user=None):
        return ORG_ID

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_user_organization_id] = override_get_org_id

    with patch("app.routers.brands.supabase_client") as mock_db:
        mock_db.return_value.table.return_value.insert.return_value.execute.return_value.data = [MOCK_BRAND]
        response = await client.post("/brands", json={"name": "Advocacia Silva"}, headers=AUTH_HEADERS)

    app.dependency_overrides.clear()
    assert response.status_code == 201
    assert response.json()["name"] == "Advocacia Silva"


@pytest.mark.asyncio
async def test_delete_brand(client):
    from app.main import app

    async def override_get_current_user():
        return MOCK_USER

    async def override_get_org_id(user=None):
        return ORG_ID

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_user_organization_id] = override_get_org_id

    with patch("app.routers.brands.supabase_client") as mock_db:
        mock_db.return_value.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock()
        response = await client.delete(f"/brands/{BRAND_ID}", headers=AUTH_HEADERS)

    app.dependency_overrides.clear()
    assert response.status_code == 204
