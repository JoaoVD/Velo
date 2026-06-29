import asyncio
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.models.schemas import KeywordCreate, KeywordOut, UserContext
from app.database import supabase_client

router = APIRouter(prefix="/brands/{brand_id}/keywords", tags=["keywords"])


@router.get("", response_model=list[KeywordOut])
async def list_keywords(brand_id: str, user: UserContext = Depends(get_current_user)):
    result = await asyncio.to_thread(
        lambda: supabase_client().table("keywords").select("*").eq("brand_id", brand_id).execute()
    )
    return result.data


@router.post("", response_model=KeywordOut, status_code=201)
async def create_keyword(brand_id: str, body: KeywordCreate, user: UserContext = Depends(get_current_user)):
    existing = await asyncio.to_thread(
        lambda: supabase_client().table("keywords").select("id").eq("brand_id", brand_id).execute()
    )
    if len(existing.data) >= 10:
        raise HTTPException(status_code=400, detail="Limite de 10 keywords atingido no plano Starter")
    result = await asyncio.to_thread(
        lambda: supabase_client().table("keywords").insert({
            "brand_id": brand_id,
            "term": body.term,
        }).execute()
    )
    return result.data[0]


@router.delete("/{keyword_id}", status_code=204)
async def delete_keyword(brand_id: str, keyword_id: str, user: UserContext = Depends(get_current_user)):
    await asyncio.to_thread(
        lambda: supabase_client().table("keywords").delete().eq("id", keyword_id).eq("brand_id", brand_id).execute()
    )
