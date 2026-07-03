import pytest
from unittest.mock import patch, MagicMock, AsyncMock


def _mock_rate_limit_row(mock_db, count):
    """Configura o select de public_checks para retornar count atual (ou nenhum registro)."""
    data = [{"ip_hash": "x", "date": "2026-07-03", "count": count}] if count is not None else []
    (mock_db.return_value.table.return_value.select.return_value
     .eq.return_value.eq.return_value.execute.return_value.data) = data


@pytest.mark.asyncio
async def test_ai_check_success(client):
    with patch("app.routers.public.supabase_client") as mock_db, \
         patch("app.routers.public.ChatGPTConnector") as MockConnector, \
         patch("app.routers.public.analyze_response", new_callable=AsyncMock) as mock_analyze:
        _mock_rate_limit_row(mock_db, None)
        mock_db.return_value.table.return_value.upsert.return_value.execute.return_value = MagicMock()
        MockConnector.return_value.query = AsyncMock(
            return_value="Recomendo a Advocacia Silva, referência em direito trabalhista em SP."
        )
        mock_analyze.return_value = {
            "mentioned": True, "position": 1, "sentiment": "positive", "competitors": {},
        }

        response = await client.post(
            "/public/ai-check",
            json={"brand_name": "Advocacia Silva", "keyword": "advogado trabalhista SP"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["mentioned"] is True
    assert body["position"] == 1
    assert body["sentiment"] == "positive"
    assert "Advocacia Silva" in body["snippet"]


@pytest.mark.asyncio
async def test_ai_check_rate_limited(client):
    with patch("app.routers.public.supabase_client") as mock_db:
        _mock_rate_limit_row(mock_db, 3)

        response = await client.post(
            "/public/ai-check",
            json={"brand_name": "Advocacia Silva", "keyword": "advogado trabalhista SP"},
        )

    assert response.status_code == 429


@pytest.mark.asyncio
async def test_ai_check_validates_input(client):
    response = await client.post(
        "/public/ai-check",
        json={"brand_name": "A", "keyword": "ab"},
    )
    assert response.status_code == 422
