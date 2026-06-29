import sys
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.connectors.base import build_consumer_prompt
from app.connectors.chatgpt import ChatGPTConnector


def test_build_consumer_prompt_contains_keyword():
    prompt = build_consumer_prompt("Advocacia Silva", "advogado trabalhista SP")
    assert "advogado trabalhista SP" in prompt


def test_build_consumer_prompt_does_not_contain_brand():
    prompt = build_consumer_prompt("Advocacia Silva", "advogado trabalhista SP")
    assert "Advocacia Silva" not in prompt


def test_build_consumer_prompt_asks_for_options():
    prompt = build_consumer_prompt("Marca X", "dentista Campinas")
    # Should ask for a list of options
    assert any(word in prompt.lower() for word in ["opções", "liste", "recomend"])


@pytest.mark.asyncio
async def test_chatgpt_connector_returns_text():
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="Recomendo o Escritório X como primeira opção..."))]

    # Patch AsyncOpenAI before instantiating the connector so self.client is the mock
    with patch("app.connectors.chatgpt.AsyncOpenAI") as MockOpenAI:
        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        MockOpenAI.return_value = mock_client

        connector = ChatGPTConnector(api_key="fake-key")
        result = await connector.query("Qual advogado trabalhista em SP?")

    assert isinstance(result, str)
    assert len(result) > 0
    assert "Recomendo" in result


@pytest.mark.asyncio
async def test_gemini_connector_returns_text():
    mock_response = MagicMock()
    mock_response.text = "Os melhores escritórios de advocacia trabalhista em SP são..."

    mock_model = MagicMock()
    mock_model.generate_content_async = AsyncMock(return_value=mock_response)

    mock_genai = MagicMock()
    mock_genai.GenerativeModel.return_value = mock_model

    # google_mock must have .generativeai = mock_genai so that
    # "import google.generativeai as genai" inside __init__ resolves correctly
    google_mock = MagicMock()
    google_mock.generativeai = mock_genai

    with patch.dict(sys.modules, {"google.generativeai": mock_genai, "google": google_mock}):
        from app.connectors.gemini import GeminiConnector
        connector = GeminiConnector(api_key="fake-key")
        result = await connector.query("Qual advogado trabalhista em SP?")

    assert isinstance(result, str)
    assert "escritórios" in result
