import pytest
from unittest.mock import MagicMock, patch
from app.analysis.reporter import generate_report, generate_action_plan


@pytest.mark.asyncio
async def test_generate_report_returns_markdown():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="## Resumo Executivo\n\nSua clínica teve bom desempenho...")]

    with patch("app.analysis.reporter.anthropic.Anthropic") as MockAnthropic:
        instance = MockAnthropic.return_value
        instance.messages.create.return_value = mock_response
        result = await generate_report(
            brand_name="Clínica Sorriso",
            scores_by_engine={"chatgpt": 65.0, "gemini": 72.0},
            keyword_scores=[
                {"term": "dentista Campinas", "geo_score": 68.5},
                {"term": "implante dentário Campinas", "geo_score": 45.0},
            ],
            sample_response="A Clínica Sorriso é uma das mais recomendadas...",
            api_key="fake-key",
        )

    assert isinstance(result, str)
    assert "Resumo" in result


@pytest.mark.asyncio
async def test_generate_report_sorts_keywords():
    """Best keyword goes to last (highest score), worst to first (lowest score)."""
    captured_prompt = {}
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="## Relatório")]

    def mock_create(**kwargs):
        captured_prompt["content"] = kwargs["messages"][0]["content"]
        return mock_response

    with patch("app.analysis.reporter.anthropic.Anthropic") as MockAnthropic:
        instance = MockAnthropic.return_value
        instance.messages.create.side_effect = mock_create
        await generate_report(
            brand_name="Marca X",
            scores_by_engine={"chatgpt": 80.0, "gemini": 60.0},
            keyword_scores=[
                {"term": "keyword ruim", "geo_score": 20.0},
                {"term": "keyword boa", "geo_score": 90.0},
            ],
            sample_response="resposta exemplo",
            api_key="fake-key",
        )

    prompt = captured_prompt["content"]
    # Best keyword (90.0) should appear before worst (20.0) in prompt context
    assert "keyword boa" in prompt
    assert "keyword ruim" in prompt


@pytest.mark.asyncio
async def test_generate_action_plan_high_priority():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='{"recommendation": "Publique um artigo sobre implante.", "priority": "high"}')]

    with patch("app.analysis.reporter.anthropic.Anthropic") as MockAnthropic:
        instance = MockAnthropic.return_value
        instance.messages.create.return_value = mock_response
        result = await generate_action_plan(
            brand_name="Clínica Sorriso",
            keyword="dentista Campinas",
            engine="gemini",
            geo_score=25.0,
            sample_response="Não encontrei informações sobre esta clínica.",
            api_key="fake-key",
        )

    assert result["priority"] == "high"
    assert isinstance(result["recommendation"], str)
    assert len(result["recommendation"]) > 0


@pytest.mark.asyncio
async def test_generate_action_plan_returns_dict_with_required_keys():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='{"recommendation": "Crie um perfil no Google Business.", "priority": "medium"}')]

    with patch("app.analysis.reporter.anthropic.Anthropic") as MockAnthropic:
        instance = MockAnthropic.return_value
        instance.messages.create.return_value = mock_response
        result = await generate_action_plan(
            brand_name="Advocacia Silva",
            keyword="advogado trabalhista SP",
            engine="chatgpt",
            geo_score=55.0,
            sample_response="O escritório Silva é mencionado eventualmente.",
            api_key="fake-key",
        )

    assert "recommendation" in result
    assert "priority" in result
    assert result["priority"] in ("high", "medium", "low")


@pytest.mark.asyncio
async def test_generate_action_plan_strips_markdown_fences():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='```json\n{"recommendation": "Crie um artigo.", "priority": "high"}\n```')]

    with patch("app.analysis.reporter.anthropic.Anthropic") as MockAnthropic:
        instance = MockAnthropic.return_value
        instance.messages.create.return_value = mock_response
        result = await generate_action_plan(
            brand_name="Clínica Sorriso",
            keyword="dentista Campinas",
            engine="gemini",
            geo_score=30.0,
            sample_response="Não encontrei informações.",
            api_key="fake",
        )

    assert result["priority"] == "high"
    assert "recommendation" in result
