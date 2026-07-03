from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import brands, keywords, scores, reports, action_plans, internal, competitors

app = FastAPI(title="Velo API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(brands.router)
app.include_router(keywords.router)
app.include_router(scores.router)
app.include_router(reports.router)
app.include_router(action_plans.router)
app.include_router(internal.router)
app.include_router(competitors.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
