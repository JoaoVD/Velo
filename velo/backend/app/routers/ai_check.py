"""Checagem ad-hoc autenticada: "Pergunte como seu cliente".

Reusa a mecânica do checker público, mas por marca (não por IP) e com
limite diário maior. O uso é registrado na tabela public_checks com uma
chave derivada do brand_id — sem migração nova.
"""

import asyncio
import hashlib
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.analysis.analyzer import analyze_response
from app.auth import get_current_user, require_brand_access
from app.config import settings
from app.connectors.base import build_consumer_prompt
from app.connectors.chatgpt import ChatGPTConnector
from app.database import supabase_client
from app.models.schemas import UserContext

router = APIRouter(prefix="/brands/{brand_id}", tags=["ai-check"])

DAILY_LIMIT = 20
SNIPPET_MAX_CHARS = 400


class AuthedCheckRequest(BaseModel):
    keyword: str = Field(min_length=3, max_length=120)


def _brand_key(brand_id: str) -> str:
    return hashlib.sha256(f"brand:{brand_id}".encode()).hexdigest()


@router.post("/ai-check")
async def authed_ai_check(
    brand_id: str,
    body: AuthedCheckRequest,
    user: UserContext = Depends(get_current_user),
):
    """Pergunta ad-hoc ao ChatGPT + análise imediata. Máx. 20/dia por marca."""
    await require_brand_access(brand_id, user)
    db = supabase_client()

    brand_rows = (await asyncio.to_thread(
        lambda: db.table("brands").select("id, name").eq("id", brand_id).execute()
    )).data or []
    if not brand_rows:
        raise HTTPException(status_code=404, detail="Marca não encontrada")
    brand_name = brand_rows[0]["name"]

    key = _brand_key(brand_id)
    today = str(datetime.now(timezone.utc).date())
    existing = (await asyncio.to_thread(
        lambda: db.table("public_checks").select("*")
        .eq("ip_hash", key).eq("date", today).execute()
    )).data or []
    current_count = existing[0]["count"] if existing else 0
    if current_count >= DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Limite diário de perguntas atingido. Volte amanhã ou aguarde o próximo scan automático.",
        )

    await asyncio.to_thread(
        lambda: db.table("public_checks").upsert({
            "ip_hash": key,
            "date": today,
            "count": current_count + 1,
        }, on_conflict="ip_hash,date").execute()
    )

    prompt = build_consumer_prompt(brand_name, body.keyword)
    response_text = await ChatGPTConnector(api_key=settings.openai_api_key).query(prompt)
    analysis = await analyze_response(
        brand_name=brand_name,
        query=body.keyword,
        response=response_text,
        api_key=settings.anthropic_api_key,
    )

    return {
        "mentioned": analysis["mentioned"],
        "position": analysis["position"],
        "sentiment": analysis["sentiment"],
        "snippet": response_text[:SNIPPET_MAX_CHARS],
        "remaining_today": DAILY_LIMIT - current_count - 1,
    }
