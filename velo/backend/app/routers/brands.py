import asyncio
from fastapi import APIRouter, Depends
from app.auth import get_current_user, get_user_organization_id
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


@router.delete("/{brand_id}", status_code=204)
async def delete_brand(brand_id: str, user: UserContext = Depends(get_current_user)):
    org_id = await get_user_organization_id(user)
    await asyncio.to_thread(
        lambda: supabase_client().table("brands").delete().eq("id", brand_id).eq("organization_id", org_id).execute()
    )
