import asyncio
from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.auth import get_current_user
from app.models.schemas import ActionPlanOut, UserContext
from app.database import supabase_client

router = APIRouter(prefix="/brands/{brand_id}", tags=["action_plans"])


@router.get("/action-plans", response_model=list[ActionPlanOut])
async def list_action_plans(
    brand_id: str,
    engine: Optional[str] = Query(None),
    user: UserContext = Depends(get_current_user),
):
    keyword_ids_result = await asyncio.to_thread(
        lambda: supabase_client().table("keywords").select("id").eq("brand_id", brand_id).execute()
    )
    keyword_ids = [k["id"] for k in keyword_ids_result.data]
    if not keyword_ids:
        return []

    def fetch():
        q = supabase_client().table("action_plans").select("*").in_("keyword_id", keyword_ids)
        if engine:
            q = q.eq("engine", engine)
        return q.order("created_at", desc=True).execute()

    result = await asyncio.to_thread(fetch)
    return result.data
