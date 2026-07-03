import asyncio
from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.auth import get_current_user, require_brand_access
from app.models.schemas import ScoreOut, UserContext
from app.database import supabase_client

router = APIRouter(prefix="/brands/{brand_id}", tags=["scores"])


@router.get("/scores", response_model=list[ScoreOut])
async def list_scores(
    brand_id: str,
    engine: Optional[str] = Query(None),
    user: UserContext = Depends(get_current_user),
):
    await require_brand_access(brand_id, user)
    keyword_ids_result = await asyncio.to_thread(
        lambda: supabase_client().table("keywords").select("id").eq("brand_id", brand_id).execute()
    )
    keyword_ids = [k["id"] for k in keyword_ids_result.data]
    if not keyword_ids:
        return []

    def fetch():
        q = supabase_client().table("scores").select("*").in_("keyword_id", keyword_ids)
        if engine:
            q = q.eq("engine", engine)
        return q.order("date", desc=True).execute()

    result = await asyncio.to_thread(fetch)
    return result.data
