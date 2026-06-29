import pytest
from unittest.mock import patch, MagicMock
from uuid import uuid4

BRAND_ID = str(uuid4())


@pytest.mark.asyncio
async def test_create_jobs_wrong_key(client):
    with patch("app.routers.internal.settings") as mock_settings:
        mock_settings.internal_api_key = "secret"
        response = await client.post(
            "/internal/create-jobs",
            headers={"X-Internal-Key": "wrong-key"},
        )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_jobs_success(client):
    mock_brands = [{"id": BRAND_ID}]

    with patch("app.routers.internal.supabase_client") as mock_db, \
         patch("app.routers.internal.settings") as mock_settings:
        mock_settings.internal_api_key = "secret"
        mock_db.return_value.table.return_value.select.return_value.execute.return_value.data = mock_brands
        mock_db.return_value.table.return_value.insert.return_value.execute.return_value = MagicMock()

        response = await client.post(
            "/internal/create-jobs",
            headers={"X-Internal-Key": "secret"},
        )

    assert response.status_code == 200
    assert response.json()["jobs_created"] == 1


@pytest.mark.asyncio
async def test_create_jobs_no_brands(client):
    with patch("app.routers.internal.supabase_client") as mock_db, \
         patch("app.routers.internal.settings") as mock_settings:
        mock_settings.internal_api_key = "secret"
        mock_db.return_value.table.return_value.select.return_value.execute.return_value.data = []

        response = await client.post(
            "/internal/create-jobs",
            headers={"X-Internal-Key": "secret"},
        )

    assert response.status_code == 200
    assert response.json()["jobs_created"] == 0
