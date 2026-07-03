import json
import asyncio
import re
import anthropic

REPORT_PROMPT = """Você é um consultor de marketing digital gerando um relatório semanal de GEO (Generative Engine Optimization) para {brand_name}.

Dados desta semana:
- Score ChatGPT: {chatgpt_score}/100
- Score Gemini: {gemini_score}/100
- Keyword com melhor score: {best_keyword} ({best_score}/100)
- Keyword com pior score: {worst_keyword} ({worst_score}/100)
- Trecho real de resposta de IA: "{sample_response}"

Escreva em português brasileiro, linguagem acessível para pequenos empresários.
Gere um relatório em markdown com:
1. ## Resumo Executivo (3-4 frases)
2. ## Score por Engine (comparação e interpretação)
3. ## Destaques por Keyword (melhor e pior)
4. ## Top 3 Ações desta Semana"""

ACTION_PLAN_PROMPT = """Você é um especialista em GEO (Generative Engine Optimization).

Marca: {brand_name}
Keyword monitorada: {keyword}
Engine: {engine}
GEO Score atual: {geo_score}/100
Trecho da resposta do {engine}: "{sample_response}"

Escreva em português brasileiro. Forneça uma recomendação específica e acionável (2-3 frases) para melhorar a presença de {brand_name} nas respostas do {engine} para esta keyword. Seja concreto: sugira tipos de conteúdo, plataformas ou ações específicas.

Retorne APENAS um JSON válido:
{{"recommendation": "...", "priority": "high", "medium" ou "low"}}

Use priority "high" se geo_score < 40, "medium" se entre 40-70, "low" se acima de 70."""


async def generate_report(
    brand_name: str,
    scores_by_engine: dict,
    keyword_scores: list[dict],
    sample_response: str,
    api_key: str,
) -> str:
    sorted_kw = sorted(keyword_scores, key=lambda x: x["geo_score"])
    prompt = REPORT_PROMPT.format(
        brand_name=brand_name,
        chatgpt_score=scores_by_engine.get("chatgpt", 0),
        gemini_score=scores_by_engine.get("gemini", 0),
        best_keyword=sorted_kw[-1]["term"] if sorted_kw else "N/A",
        best_score=sorted_kw[-1]["geo_score"] if sorted_kw else 0,
        worst_keyword=sorted_kw[0]["term"] if sorted_kw else "N/A",
        worst_score=sorted_kw[0]["geo_score"] if sorted_kw else 0,
        sample_response=sample_response[:500],
    )
    client = anthropic.Anthropic(api_key=api_key)
    message = await asyncio.to_thread(
        lambda: client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
    )
    if not message.content:
        raise ValueError("Reporter: Claude retornou resposta vazia")
    return message.content[0].text


async def generate_action_plan(
    brand_name: str,
    keyword: str,
    engine: str,
    geo_score: float,
    sample_response: str,
    api_key: str,
) -> dict:
    prompt = ACTION_PLAN_PROMPT.format(
        brand_name=brand_name,
        keyword=keyword,
        engine=engine,
        geo_score=geo_score,
        sample_response=sample_response[:400],
    )
    client = anthropic.Anthropic(api_key=api_key)
    message = await asyncio.to_thread(
        lambda: client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
    )
    if not message.content:
        raise ValueError("Reporter: Claude retornou resposta vazia")
    raw = message.content[0].text.strip()
    # Remove markdown code fences if present
    raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.MULTILINE)
    raw = re.sub(r'\s*```\s*$', '', raw, flags=re.MULTILINE)
    raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Reporter: resposta inválida do Claude para plano de ação: {raw[:200]}") from e
