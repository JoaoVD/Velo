import asyncio
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user, get_user_organization_id, require_brand_access
from app.models.schemas import BrandCreate, BrandOut, UserContext
from app.database import supabase_client

router = APIRouter(prefix="/brands", tags=["brands"])


@router.get("", response_model=list[BrandOut])
async def list_brands(user: UserContext = Depends(get_current_user)):
    org_id = await get_user_organization_id(user)
    result = await asyncio.to_thread(
        lambda: supabase_client().table("brands").select("*").eq("organization_id", org_id).execute()
    )
    return result.data


@router.post("", response_model=BrandOut, status_code=201)
async def create_brand(body: BrandCreate, user: UserContext = Depends(get_current_user)):
    org_id = await get_user_organization_id(user)
    result = await asyncio.to_thread(
        lambda: supabase_client().table("brands").insert({
            "organization_id": org_id,
            "name": body.name,
            "website": body.website,
        }).execute()
    )
    return result.data[0]


@router.post("/{brand_id}/scan", status_code=202)
async def force_scan(brand_id: str, user: UserContext = Depends(get_current_user)):
    """Cria um job de scan para a própria marca (autenticado, sem chave interna)."""
    await require_brand_access(brand_id, user)
    active = await asyncio.to_thread(
        lambda: supabase_client()
        .table("jobs")
        .select("id")
        .eq("brand_id", brand_id)
        .in_("status", ["pending", "running"])
        .execute()
    )
    if active.data:
        raise HTTPException(status_code=409, detail="Já existe um scan em andamento para esta marca")
    result = await asyncio.to_thread(
        lambda: supabase_client().table("jobs").insert({
            "brand_id": brand_id,
            "status": "pending",
        }).execute()
    )
    return {"job_id": result.data[0]["id"], "status": "pending"}


@router.delete("/{brand_id}", status_code=204)
async def delete_brand(brand_id: str, user: UserContext = Depends(get_current_user)):
    org_id = await get_user_organization_id(user)
    await asyncio.to_thread(
        lambda: supabase_client().table("brands").delete().eq("id", brand_id).eq("organization_id", org_id).execute()
    )
