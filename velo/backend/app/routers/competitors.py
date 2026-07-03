import asyncio
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user, require_brand_access
from app.models.schemas import UserContext
from app.database import supabase_client

router = APIRouter(prefix="/brands/{brand_id}/competitors", tags=["competitors"])


class CompetitorCreate(BaseModel):
    name: str


class CompetitorOut(BaseModel):
    id: str
    brand_id: str
    name: str
    created_at: str


@router.get("", response_model=list[CompetitorOut])
async def list_competitors(brand_id: str, user: UserContext = Depends(get_current_user)):
    await require_brand_access(brand_id, user)
    result = await asyncio.to_thread(
        lambda: supabase_client().table("competitors").select("*").eq("brand_id", brand_id).execute()
    )
    return result.data


@router.post("", response_model=CompetitorOut, status_code=201)
async def create_competitor(
    brand_id: str, body: CompetitorCreate, user: UserContext = Depends(get_current_user)
):
    await require_brand_access(brand_id, user)
    existing = await asyncio.to_thread(
        lambda: supabase_client().table("competitors").select("id").eq("brand_id", brand_id).execute()
    )
    if len(existing.data) >= 3:
        raise HTTPException(status_code=400, detail="Limite de 3 concorrentes atingido")
    result = await asyncio.to_thread(
        lambda: supabase_client()
        .table("competitors")
        .insert({"brand_id": brand_id, "name": body.name})
        .execute()
    )
    return result.data[0]


@router.delete("/{competitor_id}", status_code=204)
async def delete_competitor(
    brand_id: str, competitor_id: str, user: UserContext = Depends(get_current_user)
):
    await require_brand_access(brand_id, user)
    await asyncio.to_thread(
        lambda: supabase_client()
        .table("competitors")
        .delete()
        .eq("id", competitor_id)
        .eq("brand_id", brand_id)
        .execute()
    )
