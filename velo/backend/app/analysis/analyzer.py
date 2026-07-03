import json
import re
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

COMPETITOR_SUFFIX = """

Além disso, verifique cada um destes concorrentes: {competitor_list}

Adicione ao JSON a chave "competitors", um objeto em que cada chave é exatamente o nome do concorrente como listado acima e o valor é {{"mentioned": true ou false, "position": número ou null}}. Exemplo:
{{"mentioned": true, "position": 1, "sentiment": "positive", "competitors": {{"Nome Concorrente": {{"mentioned": false, "position": null}}}}}}"""


async def analyze_response(
    brand_name: str,
    query: str,
    response: str,
    api_key: str,
    competitors: list[str] | None = None,
) -> dict:
    import asyncio
    client = anthropic.Anthropic(api_key=api_key)
    prompt = ANALYSIS_PROMPT.format(
        brand_name=brand_name,
        query=query,
        response=response,
    )
    if competitors:
        prompt += COMPETITOR_SUFFIX.format(
            competitor_list=", ".join(f'"{c}"' for c in competitors)
        )
    message = await asyncio.to_thread(
        lambda: client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024 if competitors else 256,
            messages=[{"role": "user", "content": prompt}],
        )
    )
    if not message.content:
        raise ValueError("Analyzer: Claude retornou resposta vazia")
    raw = message.content[0].text.strip()
    # Remove markdown code fences if present
    raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.MULTILINE)
    raw = re.sub(r'\s*```\s*$', '', raw, flags=re.MULTILINE)
    try:
        result = json.loads(raw.strip())
    except json.JSONDecodeError as e:
        raise ValueError(f"Analyzer: JSON inválido do Claude: {raw[:200]}") from e
    result.setdefault("competitors", {})
    return result
