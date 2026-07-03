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


@router.get("/share-of-voice")
async def share_of_voice(brand_id: str, user: UserContext = Depends(get_current_user)):
    """Marca vs. concorrentes: % de respostas que mencionam cada um, por keyword/engine (scan mais recente)."""
    await require_brand_access(brand_id, user)
    db = supabase_client()

    keywords = (await asyncio.to_thread(
        lambda: db.table("keywords").select("id, term").eq("brand_id", brand_id).execute()
    )).data or []
    competitors = (await asyncio.to_thread(
        lambda: db.table("competitors").select("id, name").eq("brand_id", brand_id).execute()
    )).data or []
    if not keywords or not competitors:
        return {"date": None, "keywords": []}

    keyword_ids = [k["id"] for k in keywords]
    comp_rows = (await asyncio.to_thread(
        lambda: db.table("competitor_scores").select("*")
        .in_("keyword_id", keyword_ids)
        .order("date", desc=True)
        .execute()
    )).data or []
    if not comp_rows:
        return {"date": None, "keywords": []}

    latest_date = comp_rows[0]["date"]
    comp_rows = [r for r in comp_rows if r["date"] == latest_date]

    brand_rows = (await asyncio.to_thread(
        lambda: db.table("scores").select("keyword_id, engine, frequency_score")
        .in_("keyword_id", keyword_ids)
        .eq("date", latest_date)
        .execute()
    )).data or []
    brand_freq = {(r["keyword_id"], r["engine"]): float(r["frequency_score"]) for r in brand_rows}
    comp_names = {c["id"]: c["name"] for c in competitors}
    terms = {k["id"]: k["term"] for k in keywords}

    entries: dict[tuple, dict] = {}
    for r in comp_rows:
        key = (r["keyword_id"], r["engine"])
        if key not in entries:
            entries[key] = {
                "keyword_id": r["keyword_id"],
                "term": terms.get(r["keyword_id"], ""),
                "engine": r["engine"],
                "brand_frequency": brand_freq.get(key, 0.0),
                "competitors": [],
            }
        entries[key]["competitors"].append({
            "id": r["competitor_id"],
            "name": comp_names.get(r["competitor_id"], ""),
            "frequency_score": float(r["frequency_score"]),
            "position_score": float(r["position_score"]),
        })

    return {"date": latest_date, "keywords": list(entries.values())}


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
