import json
import anthropic

ANALYSIS_PROMPT = """Analise a resposta abaixo e determine se "{brand_name}" foi mencionada.

Pergunta original: {query}

Resposta da IA:
{response}

Retorne APENAS um JSON válido, sem texto adicional:
{{"mentioned": true ou false, "position": número da posição (1, 2, 3, etc.) ou null se não mencionada, "sentiment": "positive", "neutral" ou "negative" ou null se não mencionada}}

Regras:
- position 1 = primeira recomendação/opção listada
- sentiment deve refletir como a marca é descrita (positivo = elogios, neutro = apenas citado, negativo = críticas)
- Se não mencionada, position e sentiment devem ser null"""


async def analyze_response(
    brand_name: str,
    query: str,
    response: str,
    api_key: str,
) -> dict:
    import asyncio
    client = anthropic.Anthropic(api_key=api_key)
    prompt = ANALYSIS_PROMPT.format(
        brand_name=brand_name,
        query=query,
        response=response,
    )
    message = await asyncio.to_thread(
        lambda: client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        )
    )
    raw = message.content[0].text.strip()
    return json.loads(raw)
