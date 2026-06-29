from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional


class UserContext(BaseModel):
    id: str  # UUID as string (from Supabase)
    email: str


class BrandCreate(BaseModel):
    name: str
    website: Optional[str] = None


class BrandOut(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    website: Optional[str] = None
    created_at: datetime


class KeywordCreate(BaseModel):
    term: str


class KeywordOut(BaseModel):
    id: UUID
    brand_id: UUID
    term: str
    created_at: datetime


class ScoreCreate(BaseModel):
    keyword_id: UUID
    engine: str
    mention_score: float
    position_score: float
    sentiment_score: float
    frequency_score: float
    geo_score: float


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


class ReportCreate(BaseModel):
    brand_id: UUID
    period_start: date
    period_end: date
    content_md: str


class ReportOut(BaseModel):
    id: UUID
    brand_id: UUID
    period_start: date
    period_end: date
    content_md: str
    created_at: datetime


class ActionPlanCreate(BaseModel):
    keyword_id: UUID
    engine: str
    recommendation: str
    priority: str


class ActionPlanOut(BaseModel):
    id: UUID
    keyword_id: UUID
    engine: str
    recommendation: str
    priority: str
    created_at: datetime
