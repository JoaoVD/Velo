import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from uuid import uuid4
from app.auth import get_current_user

BRAND_ID = str(uuid4())
USER_ID = str(uuid4())
MOCK_USER = MagicMock(id=USER_ID, email="test@test.com")
AUTH_HEADERS = {"Authorization": "Bearer fake-token"}


def _setup_db(mock_db, brand_name="Advocacia Silva", usage_count=None):
    """Mock: brand lookup retorna nome; usage select retorna count atual."""
    def table_side_effect(name):
        t = MagicMock()
        if name == "brands":
            t.select.return_value.eq.return_value.execute.return_value.data = [
                {"id": BRAND_ID, "name": brand_name}
            ]
        elif name == "public_checks":
            data = (
                [{"ip_hash": "x", "date": "2026-07-03", "count": usage_count}]
                if usage_count is not None
                else []
            )
            t.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = data
            t.upsert.return_value.execute.return_value = MagicMock()
        return t

    mock_db.return_value.table.side_effect = table_side_effect


@pytest.mark.asyncio
async def test_authed_ai_check_success(client):
    from app.main import app

    async def override():
        return MOCK_USER

    app.dependency_overrides[get_current_user] = override

    with patch("app.routers.ai_check.supabase_client") as mock_db, \
         patch("app.routers.ai_check.require_brand_access", new_callable=AsyncMock), \
         patch("app.routers.ai_check.ChatGPTConnector") as MockConnector, \
         patch("app.routers.ai_check.analyze_response", new_callable=AsyncMock) as mock_analyze:
        _setup_db(mock_db, usage_count=None)
        MockConnector.return_value.query = AsyncMock(
            return_value="Recomendo a Advocacia Silva, referência em SP."
        )
        mock_analyze.return_value = {
            "mentioned": True, "position": 1, "sentiment": "positive", "competitors": {},
        }

        response = await client.post(
            f"/brands/{BRAND_ID}/ai-check",
            json={"keyword": "advogado trabalhista SP"},
            headers=AUTH_HEADERS,
        )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    body = response.json()
    assert body["mentioned"] is True
    assert body["position"] == 1
    assert body["remaining_today"] == 19
    assert "Advocacia Silva" in body["snippet"]


@pytest.mark.asyncio
async def test_authed_ai_check_rate_limited(client):
    from app.main import app

    async def override():
        return MOCK_USER

    app.dependency_overrides[get_current_user] = override

    with patch("app.routers.ai_check.supabase_client") as mock_db, \
         patch("app.routers.ai_check.require_brand_access", new_callable=AsyncMock):
        _setup_db(mock_db, usage_count=20)

        response = await client.post(
            f"/brands/{BRAND_ID}/ai-check",
            json={"keyword": "advogado trabalhista SP"},
            headers=AUTH_HEADERS,
        )

    app.dependency_overrides.clear()
    assert response.status_code == 429


@pytest.mark.asyncio
async def test_authed_ai_check_requires_auth(client):
    response = await client.post(
        f"/brands/{BRAND_ID}/ai-check",
        json={"keyword": "advogado trabalhista SP"},
    )
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_authed_ai_check_validates_input(client):
    from app.main import app

    async def override():
        return MOCK_USER

    app.dependency_overrides[get_current_user] = override

    response = await client.post(
        f"/brands/{BRAND_ID}/ai-check",
        json={"keyword": "ab"},
        headers=AUTH_HEADERS,
    )

    app.dependency_overrides.clear()
    assert response.status_code == 422
