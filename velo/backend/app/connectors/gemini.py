from app.connectors.base import LLMConnector


class GeminiConnector(LLMConnector):
    def __init__(self, api_key: str):
        import google.generativeai as genai
        self._genai = genai
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    async def query(self, prompt: str) -> str:
        response = await self.model.generate_content_async(prompt)
        return response.text
