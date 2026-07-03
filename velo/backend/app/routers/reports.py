import asyncio
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user, require_brand_access
from app.models.schemas import ReportOut, UserContext
from app.database import supabase_client

router = APIRouter(prefix="/brands/{brand_id}", tags=["reports"])


@router.get("/reports/latest", response_model=ReportOut)
async def get_latest_report(brand_id: str, user: UserContext = Depends(get_current_user)):
    await require_brand_access(brand_id, user)
    result = await asyncio.to_thread(
        lambda: supabase_client()
        .table("reports")
        .select("*")
        .eq("brand_id", brand_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Nenhum relatório encontrado")
    return result.data[0]
