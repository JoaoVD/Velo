from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional


class BrandCreate(BaseModel):
    name: str
    website: Optional[str] = None


class BrandOut(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    website: Optional[str]
    created_at: datetime


class KeywordCreate(BaseModel):
    term: str


class KeywordOut(BaseModel):
    id: UUID
    brand_id: UUID
    term: str
    created_at: datetime


class ScoreOut(BaseModel):
    id: UUID
    keyword_id: UUID
    engine: str
    date: date
    mention_score: float
    position_score: float
    sentiment_score: float
    frequency_score: float
    geo_score: float


class ReportOut(BaseModel):
    id: UUID
    brand_id: UUID
    period_start: date
    period_end: date
    content_md: str
    created_at: datetime


class ActionPlanOut(BaseModel):
    id: UUID
    keyword_id: UUID
    engine: str
    recommendation: str
    priority: str
    created_at: datetime
