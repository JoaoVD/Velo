from openai import AsyncOpenAI
from app.connectors.base import LLMConnector


class ChatGPTConnector(LLMConnector):
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def query(self, prompt: str) -> str:
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.7,
        )
        if not response.choices or response.choices[0].message.content is None:
            raise ValueError("ChatGPT retornou resposta vazia")
        return response.choices[0].message.content
