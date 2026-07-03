import asyncio
import hashlib
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.config import settings
from app.database import supabase_client
from app.connectors.chatgpt import ChatGPTConnector
from app.connectors.base import build_consumer_prompt
from app.analysis.analyzer import analyze_response

router = APIRouter(prefix="/public", tags=["public"])

DAILY_LIMIT = 3
SNIPPET_MAX_CHARS = 300


class CheckRequest(BaseModel):
    brand_name: str = Field(min_length=2, max_length=80)
    keyword: str = Field(min_length=3, max_length=120)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _ip_hash(ip: str) -> str:
    # Hash com salt: rate limit por IP sem armazenar o IP em claro (LGPD)
    return hashlib.sha256(f"{settings.internal_api_key}:{ip}".encode()).hexdigest()


@router.post("/ai-check")
async def ai_check(body: CheckRequest, request: Request):
    """Verificação gratuita (sem login): 1 consulta ao ChatGPT + análise. Máx. 3/dia por IP."""
    db = supabase_client()
    ip_hash = _ip_hash(_client_ip(request))
    today = str(datetime.now(timezone.utc).date())

    existing = (await asyncio.to_thread(
        lambda: db.table("public_checks").select("*")
        .eq("ip_hash", ip_hash).eq("date", today).execute()
    )).data or []
    current_count = existing[0]["count"] if existing else 0
    if current_count >= DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Limite diário de verificações gratuitas atingido. Crie uma conta para monitorar sua marca toda semana.",
        )

    await asyncio.to_thread(
        lambda: db.table("public_checks").upsert({
            "ip_hash": ip_hash,
            "date": today,
            "count": current_count + 1,
        }, on_conflict="ip_hash,date").execute()
    )

    prompt = build_consumer_prompt(body.brand_name, body.keyword)
    response_text = await ChatGPTConnector(api_key=settings.openai_api_key).query(prompt)
    analysis = await analyze_response(
        brand_name=body.brand_name,
        query=body.keyword,
        response=response_text,
        api_key=settings.anthropic_api_key,
    )

    return {
        "mentioned": analysis["mentioned"],
        "position": analysis["position"],
        "sentiment": analysis["sentiment"],
        "snippet": response_text[:SNIPPET_MAX_CHARS],
    }
