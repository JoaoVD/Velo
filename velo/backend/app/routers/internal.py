import asyncio
from fastapi import APIRouter, Header, HTTPException
from app.database import supabase_client
from app.config import settings

router = APIRouter(prefix="/internal", tags=["internal"])


@router.post("/create-jobs")
async def create_jobs(x_internal_key: str = Header(...)):
    if x_internal_key != settings.internal_api_key:
        raise HTTPException(status_code=403, detail="Chave inválida")

    brands_result = await asyncio.to_thread(
        lambda: supabase_client().table("brands").select("id").execute()
    )
    count = 0
    for brand in brands_result.data:
        await asyncio.to_thread(
            lambda b=brand: supabase_client().table("jobs").insert({
                "brand_id": b["id"],
                "status": "pending",
            }).execute()
        )
        count += 1

    return {"jobs_created": count}
