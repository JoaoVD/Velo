import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from app.analysis.analyzer import analyze_response

@pytest.mark.asyncio
async def test_analyze_mentioned_first_positive():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='{"mentioned": true, "position": 1, "sentiment": "positive"}')]

    with patch("app.analysis.analyzer.anthropic.Anthropic") as MockAnthropic:
        instance = MockAnthropic.return_value
        instance.messages.create.return_value = mock_response
        result = await analyze_response(
            brand_name="Advocacia Silva",
            query="advogado trabalhista SP",
            response="Recomendo a Advocacia Silva em primeiro lugar, é excelente...",
            api_key="fake-key",
        )

    assert result["mentioned"] is True
    assert result["position"] == 1
    assert result["sentiment"] == "positive"

@pytest.mark.asyncio
async def test_analyze_not_mentioned():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='{"mentioned": false, "position": null, "sentiment": null}')]

    with patch("app.analysis.analyzer.anthropic.Anthropic") as MockAnthropic:
        instance = MockAnthropic.return_value
        instance.messages.create.return_value = mock_response
        result = await analyze_response(
            brand_name="Advocacia Silva",
            query="advogado trabalhista SP",
            response="Recomendo o Escritório Pereira e o Escritório Almeida...",
            api_key="fake-key",
        )

    assert result["mentioned"] is False
    assert result["position"] is None
    assert result["sentiment"] is None

@pytest.mark.asyncio
async def test_analyze_mentioned_third_neutral():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='{"mentioned": true, "position": 3, "sentiment": "neutral"}')]

    with patch("app.analysis.analyzer.anthropic.Anthropic") as MockAnthropic:
        instance = MockAnthropic.return_value
        instance.messages.create.return_value = mock_response
        result = await analyze_response(
            brand_name="Advocacia Silva",
            query="advogado trabalhista SP",
            response="1. Escritório X, 2. Escritório Y, 3. Advocacia Silva",
            api_key="fake-key",
        )

    assert result["mentioned"] is True
    assert result["position"] == 3
    assert result["sentiment"] == "neutral"
