import pytest
from unittest.mock import AsyncMock, patch, MagicMock, call
from uuid import uuid4

JOB_ID = str(uuid4())
BRAND_ID = str(uuid4())
KW_ID = str(uuid4())

MOCK_JOB = {"id": JOB_ID, "brand_id": BRAND_ID, "attempt_count": 0}
MOCK_BRAND = {"id": BRAND_ID, "name": "Advocacia Silva"}
MOCK_KEYWORDS = [{"id": KW_ID, "term": "advogado trabalhista SP"}]
MOCK_ANALYSIS = {"mentioned": True, "position": 1, "sentiment": "positive"}
MOCK_SCORE = {"mention_score": 100.0, "position_score": 100.0, "sentiment_score": 100.0, "frequency_score": 100.0, "geo_score": 100.0}


@pytest.mark.asyncio
async def test_process_job_happy_path():
    with patch("worker.processor.supabase_client") as mock_supabase_fn, \
         patch("worker.processor.ChatGPTConnector") as MockChatGPT, \
         patch("worker.processor.GeminiConnector") as MockGemini, \
         patch("worker.processor.analyze_response", new_callable=AsyncMock, return_value=MOCK_ANALYSIS), \
         patch("worker.processor.calculate_geo_score", return_value=MOCK_SCORE), \
         patch("worker.processor.generate_report", new_callable=AsyncMock, return_value="## Relatório"), \
         patch("worker.processor.generate_action_plan", new_callable=AsyncMock, return_value={"recommendation": "Publique X", "priority": "low"}), \
         patch("worker.processor.settings") as mock_settings:

        mock_settings.openai_api_key = "fake"
        mock_settings.gemini_api_key = "fake"
        mock_settings.anthropic_api_key = "fake"

        mock_db = MagicMock()
        mock_supabase_fn.return_value = mock_db

        # Create shared mocks for each table so we can inspect their calls afterwards
        jobs_table_mock = MagicMock()
        jobs_table_mock.select.return_value.eq.return_value.single.return_value.execute.return_value.data = MOCK_JOB
        jobs_table_mock.update.return_value.eq.return_value.execute.return_value = MagicMock()

        brands_table_mock = MagicMock()
        brands_table_mock.select.return_value.eq.return_value.single.return_value.execute.return_value.data = MOCK_BRAND

        keywords_table_mock = MagicMock()
        keywords_table_mock.select.return_value.eq.return_value.execute.return_value.data = MOCK_KEYWORDS

        other_table_mock = MagicMock()
        other_table_mock.insert.return_value.execute.return_value = MagicMock()
        other_table_mock.upsert.return_value.execute.return_value = MagicMock()

        def table_side_effect(name):
            if name == "jobs":
                return jobs_table_mock
            elif name == "brands":
                return brands_table_mock
            elif name == "keywords":
                return keywords_table_mock
            else:
                return other_table_mock

        mock_db.table.side_effect = table_side_effect

        MockChatGPT.return_value.query = AsyncMock(return_value="Recomendo a Advocacia Silva...")
        MockGemini.return_value.query = AsyncMock(return_value="Entre os melhores: Advocacia Silva")

        from worker.processor import process_job
        await process_job(JOB_ID)

        # Verify that the job was specifically updated to status "done"
        update_calls = [call[0][0] for call in jobs_table_mock.update.call_args_list]
        assert any(
            isinstance(args, dict) and args.get("status") == "done"
            for args in update_calls
        ), f"Expected status='done' update, got: {update_calls}"
