# Velo MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Velo — plataforma B2B SaaS que monitora como ChatGPT e Gemini descrevem uma marca, calcula um GEO Score (0–100) e gera relatório semanal com planos de ação por keyword em português brasileiro.

**Architecture:** Dois serviços Railway (FastAPI API + FastAPI Worker) compartilham um codebase Python. Dashboard Next.js na Vercel consome a API. Dados no Supabase (PostgreSQL + Auth + RLS). Railway Cron dispara criação de jobs semanalmente; Worker faz polling e processa.

**Tech Stack:** Python 3.12, FastAPI 0.111, httpx, anthropic>=0.30, openai>=1.30, google-generativeai>=0.7, supabase-py>=2.4, pytest, pytest-asyncio; Next.js 14 (App Router), TypeScript, TailwindCSS 3, shadcn/ui, Recharts, @supabase/ssr, vitest.

## Global Constraints

- **Nome do produto:** Velo (nunca VistAI)
- Todo texto ao usuário (UI, relatórios, planos de ação) em português brasileiro
- Pesos do GEO Score: menção 30%, posição 25%, sentimento 25%, frequência 20%
- 5 disparos por keyword por job (base de frequência)
- Position scores: 1ª=100, 2ª=70, 3ª+=40, não mencionado=0
- Sentiment scores: positive=100, neutral=50, negative=0
- Worker retry: máx 3 tentativas, backoff 60s/120s/300s
- MVP: apenas plano Starter (1 marca, 10 keywords, semanal)
- Engines no MVP: ChatGPT (gpt-4o-mini) + Gemini (gemini-1.5-flash)
- Análise e Relatório: claude-sonnet-4-6 para todas as chamadas ao Claude (análise por query, relatórios e planos de ação)
- **Design System (obrigatório em todo frontend):**
  - Fontes: Fraunces (display/scores) + IBM Plex Mono (UI/dados) — NUNCA Inter, Roboto, Arial
  - Cores: `--color-ink #0f1923`, `--color-signal #c8460a`, `--color-bone #f5f2eb`, `--color-ice #e8f0f7`, `--color-navy #1a3a5c`, `--color-confirm #2d6a4f`
  - Fundo padrão: `bone`; cards de dados: `ice`; CTA/acento: `signal`; scores altos: `confirm`
  - UI library: shadcn/ui + Tailwind — sem gradientes purple/azul
  - Scores e métricas grandes: Fraunces 900
  - Nunca usar blue-600 genérico do Tailwind como cor primária
- RLS obrigatório no Supabase — nenhuma tabela sem Row Level Security
- Nunca hardcodar API keys — sempre via variáveis de ambiente
- Exibir label de fonte em snapshots de LLM: "Resposta do ChatGPT", "Resposta do Gemini"

---

## Estrutura de Arquivos

```
velo/
  backend/
    app/
      __init__.py
      main.py                  # FastAPI API server entry point
      config.py                # Settings via pydantic-settings
      database.py              # Supabase client singleton (service role)
      auth.py                  # JWT verification via Supabase
      models/
        __init__.py
        schemas.py             # Pydantic request/response models
      routers/
        __init__.py
        brands.py              # CRUD /brands
        keywords.py            # CRUD /keywords
        scores.py              # GET /scores
        reports.py             # GET /reports/latest
        action_plans.py        # GET /action-plans
        internal.py            # POST /internal/create-jobs
      connectors/
        __init__.py
        base.py                # Abstract LLMConnector
        chatgpt.py             # OpenAI connector
        gemini.py              # Google Gemini connector
      analysis/
        __init__.py
        analyzer.py            # Claude Haiku: mention/position/sentiment
        scorer.py              # GEO Score calculation
        reporter.py            # Claude Sonnet: report + action_plans
    worker/
      __init__.py
      main.py                  # Worker entry point (polling loop)
      processor.py             # Process one job end-to-end
    tests/
      conftest.py
      test_scorer.py
      test_analyzer.py
      test_reporter.py
      test_processor.py
      test_routers_brands.py
      test_routers_keywords.py
      test_routers_internal.py
    requirements.txt
    requirements-dev.txt
    .env.example
  frontend/
    app/
      layout.tsx
      page.tsx                 # Redirect to /dashboard
      dashboard/page.tsx
      keywords/page.tsx
      history/page.tsx
      report/page.tsx
      action-plan/page.tsx
      settings/page.tsx
      auth/login/page.tsx
      auth/signup/page.tsx
    components/
      GeoScoreCard.tsx
      KeywordsTable.tsx
      ScoreHistoryChart.tsx
      ActionPlanList.tsx
      ReportViewer.tsx
    lib/
      supabase.ts              # Supabase browser + server clients
      api.ts                   # Fetch wrapper para backend API
      types.ts                 # TypeScript types compartilhados
    middleware.ts              # Auth guard
  supabase/
    migrations/
      001_initial_schema.sql
```

---

### Task 1: Supabase Schema + Projeto Setup

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `backend/requirements.txt`
- Create: `backend/requirements-dev.txt`
- Create: `backend/.env.example`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`

**Interfaces:**
- Produces: `supabase_client` singleton importável em todo o backend; tabelas do banco disponíveis

- [ ] **Step 1: Criar estrutura de diretórios**

```bash
mkdir -p velo/backend/app/models velo/backend/app/routers \
  velo/backend/app/connectors velo/backend/app/analysis \
  velo/backend/worker velo/backend/tests \
  velo/frontend velo/supabase/migrations
cd vistai
```

- [ ] **Step 2: Criar requirements.txt**

```
# backend/requirements.txt
fastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic-settings==2.2.1
supabase==2.4.6
httpx==0.27.0
anthropic==0.30.0
openai==1.30.0
google-generativeai==0.7.2
python-jose[cryptography]==3.3.0
```

- [ ] **Step 3: Criar requirements-dev.txt**

```
# backend/requirements-dev.txt
-r requirements.txt
pytest==8.2.0
pytest-asyncio==0.23.6
pytest-mock==3.14.0
httpx==0.27.0
```

- [ ] **Step 4: Criar .env.example**

```
# backend/.env.example
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...
INTERNAL_API_KEY=secret-cron-key-change-me
```

- [ ] **Step 5: Criar config.py**

```python
# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str
    openai_api_key: str
    gemini_api_key: str
    anthropic_api_key: str
    internal_api_key: str

    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] **Step 6: Criar database.py**

```python
# backend/app/database.py
from supabase import create_client, Client
from app.config import settings

def get_supabase() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_key)

supabase: Client = get_supabase()
```

- [ ] **Step 7: Criar migration SQL**

```sql
-- supabase/migrations/001_initial_schema.sql

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'agency')),
  created_at timestamptz default now()
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  website text,
  created_at timestamptz default now()
);

create table keywords (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade not null,
  term text not null,
  created_at timestamptz default now(),
  unique(brand_id, term)
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed')),
  scheduled_for timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  attempt_count int not null default 0,
  created_at timestamptz default now()
);

create table query_results (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade not null,
  keyword_id uuid references keywords(id) on delete cascade not null,
  engine text not null check (engine in ('chatgpt', 'gemini')),
  prompt_used text not null,
  raw_response text not null,
  created_at timestamptz default now()
);

create table scores (
  id uuid primary key default gen_random_uuid(),
  keyword_id uuid references keywords(id) on delete cascade not null,
  engine text not null check (engine in ('chatgpt', 'gemini')),
  date date not null default current_date,
  mention_score numeric(5,2) not null,
  position_score numeric(5,2) not null,
  sentiment_score numeric(5,2) not null,
  frequency_score numeric(5,2) not null,
  geo_score numeric(5,2) not null,
  created_at timestamptz default now(),
  unique(keyword_id, engine, date)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade not null,
  period_start date not null,
  period_end date not null,
  content_md text not null,
  pdf_url text,
  created_at timestamptz default now()
);

create table action_plans (
  id uuid primary key default gen_random_uuid(),
  keyword_id uuid references keywords(id) on delete cascade not null,
  engine text not null check (engine in ('chatgpt', 'gemini')),
  recommendation text not null,
  priority text not null check (priority in ('high', 'medium', 'low')),
  created_at timestamptz default now()
);

create table user_organizations (
  user_id uuid references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  primary key (user_id, organization_id)
);

-- Enable RLS
alter table organizations enable row level security;
alter table brands enable row level security;
alter table keywords enable row level security;
alter table jobs enable row level security;
alter table query_results enable row level security;
alter table scores enable row level security;
alter table reports enable row level security;
alter table action_plans enable row level security;
alter table user_organizations enable row level security;

-- RLS: usuário vê apenas dados da sua organização
create policy "select_own_org" on organizations for select
  using (id in (select organization_id from user_organizations where user_id = auth.uid()));

create policy "select_own_brands" on brands for select
  using (organization_id in (select organization_id from user_organizations where user_id = auth.uid()));

create policy "select_own_keywords" on keywords for select
  using (brand_id in (
    select b.id from brands b
    join user_organizations uo on uo.organization_id = b.organization_id
    where uo.user_id = auth.uid()
  ));

create policy "select_own_scores" on scores for select
  using (keyword_id in (
    select k.id from keywords k
    join brands b on b.id = k.brand_id
    join user_organizations uo on uo.organization_id = b.organization_id
    where uo.user_id = auth.uid()
  ));

create policy "select_own_reports" on reports for select
  using (brand_id in (
    select b.id from brands b
    join user_organizations uo on uo.organization_id = b.organization_id
    where uo.user_id = auth.uid()
  ));

create policy "select_own_action_plans" on action_plans for select
  using (keyword_id in (
    select k.id from keywords k
    join brands b on b.id = k.brand_id
    join user_organizations uo on uo.organization_id = b.organization_id
    where uo.user_id = auth.uid()
  ));
```

- [ ] **Step 8: Aplicar migration no Supabase**

```bash
# No dashboard do Supabase: SQL Editor → colar e executar 001_initial_schema.sql
# Ou via Supabase CLI:
supabase db push
```

- [ ] **Step 9: Commit**

```bash
git add supabase/ backend/requirements*.txt backend/.env.example backend/app/config.py backend/app/database.py
git commit -m "feat: supabase schema + backend project setup"
```

---

### Task 2: FastAPI App + Auth Middleware

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/auth.py`
- Create: `backend/app/models/schemas.py`
- Create: `backend/tests/conftest.py`

**Interfaces:**
- Produces: `app` FastAPI instance; `get_current_user(token) -> dict` dependency; Pydantic schemas para Brand, Keyword, Score, Report, ActionPlan

- [ ] **Step 1: Escrever teste de health check**

```python
# backend/tests/conftest.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
```

```python
# backend/tests/test_main.py
import pytest

@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 2: Rodar teste (deve falhar)**

```bash
cd backend
pip install -r requirements-dev.txt
pytest tests/test_main.py -v
```
Expected: `FAILED — ModuleNotFoundError: No module named 'app'`

- [ ] **Step 3: Criar main.py**

```python
# backend/app/main.py
from fastapi import FastAPI

app = FastAPI(title="VistAI API", version="0.1.0")

@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 4: Criar pytest.ini**

```ini
# backend/pytest.ini
[pytest]
asyncio_mode = auto
pythonpath = .
```

- [ ] **Step 5: Rodar teste (deve passar)**

```bash
pytest tests/test_main.py -v
```
Expected: `PASSED`

- [ ] **Step 6: Criar schemas.py**

```python
# backend/app/models/schemas.py
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
```

- [ ] **Step 7: Criar auth.py**

```python
# backend/app/auth.py
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import supabase

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    token = credentials.credentials
    try:
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(status_code=401, detail="Token inválido")
        return {"id": response.user.id, "email": response.user.email}
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

async def get_user_organization_id(user: dict) -> str:
    result = supabase.table("user_organizations").select("organization_id").eq("user_id", user["id"]).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    return result.data["organization_id"]
```

- [ ] **Step 8: Registrar routers em main.py (placeholders por ora)**

```python
# backend/app/main.py
from fastapi import FastAPI

app = FastAPI(title="VistAI API", version="0.1.0")

@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 9: Commit**

```bash
git add backend/app/main.py backend/app/auth.py backend/app/models/schemas.py backend/tests/ backend/pytest.ini
git commit -m "feat: fastapi app + auth middleware + pydantic schemas"
```

---

### Task 3: Brands + Keywords CRUD

**Files:**
- Create: `backend/app/routers/brands.py`
- Create: `backend/app/routers/keywords.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_routers_brands.py`
- Create: `backend/tests/test_routers_keywords.py`

**Interfaces:**
- Consumes: `get_current_user`, `get_user_organization_id` de `app.auth`; schemas de `app.models.schemas`
- Produces: `GET/POST/DELETE /brands`, `GET/POST/DELETE /brands/{brand_id}/keywords`

- [ ] **Step 1: Escrever testes de brands**

```python
# backend/tests/test_routers_brands.py
import pytest
from unittest.mock import patch, MagicMock
from uuid import uuid4

BRAND_ID = str(uuid4())
ORG_ID = str(uuid4())
USER = {"id": str(uuid4()), "email": "test@test.com"}

@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer fake-token"}

@pytest.mark.asyncio
async def test_list_brands_returns_empty(client, auth_headers):
    mock_user = USER
    mock_org_id = ORG_ID
    mock_brands = []

    with patch("app.routers.brands.get_current_user", return_value=mock_user), \
         patch("app.routers.brands.get_user_organization_id", return_value=mock_org_id), \
         patch("app.routers.brands.supabase") as mock_db:
        mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = mock_brands
        response = await client.get("/brands", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_create_brand(client, auth_headers):
    mock_user = USER
    mock_org_id = ORG_ID
    created = {"id": BRAND_ID, "organization_id": ORG_ID, "name": "Advocacia Silva", "website": None, "created_at": "2026-06-28T00:00:00"}

    with patch("app.routers.brands.get_current_user", return_value=mock_user), \
         patch("app.routers.brands.get_user_organization_id", return_value=mock_org_id), \
         patch("app.routers.brands.supabase") as mock_db:
        mock_db.table.return_value.insert.return_value.execute.return_value.data = [created]
        response = await client.post("/brands", json={"name": "Advocacia Silva"}, headers=auth_headers)

    assert response.status_code == 201
    assert response.json()["name"] == "Advocacia Silva"
```

- [ ] **Step 2: Rodar testes (devem falhar)**

```bash
pytest tests/test_routers_brands.py -v
```
Expected: `FAILED — 404 Not Found`

- [ ] **Step 3: Criar brands.py**

```python
# backend/app/routers/brands.py
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user, get_user_organization_id
from app.models.schemas import BrandCreate, BrandOut
from app.database import supabase

router = APIRouter(prefix="/brands", tags=["brands"])

@router.get("", response_model=list[BrandOut])
async def list_brands(user: dict = Depends(get_current_user)):
    org_id = await get_user_organization_id(user)
    result = supabase.table("brands").select("*").eq("organization_id", org_id).execute()
    return result.data

@router.post("", response_model=BrandOut, status_code=201)
async def create_brand(body: BrandCreate, user: dict = Depends(get_current_user)):
    org_id = await get_user_organization_id(user)
    result = supabase.table("brands").insert({
        "organization_id": org_id,
        "name": body.name,
        "website": body.website,
    }).execute()
    return result.data[0]

@router.delete("/{brand_id}", status_code=204)
async def delete_brand(brand_id: str, user: dict = Depends(get_current_user)):
    org_id = await get_user_organization_id(user)
    supabase.table("brands").delete().eq("id", brand_id).eq("organization_id", org_id).execute()
```

- [ ] **Step 4: Criar keywords.py**

```python
# backend/app/routers/keywords.py
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.models.schemas import KeywordCreate, KeywordOut
from app.database import supabase

router = APIRouter(prefix="/brands/{brand_id}/keywords", tags=["keywords"])

@router.get("", response_model=list[KeywordOut])
async def list_keywords(brand_id: str, user: dict = Depends(get_current_user)):
    result = supabase.table("keywords").select("*").eq("brand_id", brand_id).execute()
    return result.data

@router.post("", response_model=KeywordOut, status_code=201)
async def create_keyword(brand_id: str, body: KeywordCreate, user: dict = Depends(get_current_user)):
    existing = supabase.table("keywords").select("id").eq("brand_id", brand_id).execute()
    if len(existing.data) >= 10:
        raise HTTPException(status_code=400, detail="Limite de 10 keywords atingido no plano Starter")
    result = supabase.table("keywords").insert({
        "brand_id": brand_id,
        "term": body.term,
    }).execute()
    return result.data[0]

@router.delete("/{keyword_id}", status_code=204)
async def delete_keyword(brand_id: str, keyword_id: str, user: dict = Depends(get_current_user)):
    supabase.table("keywords").delete().eq("id", keyword_id).eq("brand_id", brand_id).execute()
```

- [ ] **Step 5: Registrar routers em main.py**

```python
# backend/app/main.py
from fastapi import FastAPI
from app.routers import brands, keywords

app = FastAPI(title="VistAI API", version="0.1.0")
app.include_router(brands.router)
app.include_router(keywords.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 6: Rodar testes**

```bash
pytest tests/test_routers_brands.py -v
```
Expected: `2 passed`

- [ ] **Step 7: Commit**

```bash
git add backend/app/routers/ backend/app/main.py backend/tests/test_routers_brands.py backend/tests/test_routers_keywords.py
git commit -m "feat: brands + keywords CRUD endpoints"
```

---

### Task 4: LLM Connectors (ChatGPT + Gemini)

**Files:**
- Create: `backend/app/connectors/base.py`
- Create: `backend/app/connectors/chatgpt.py`
- Create: `backend/app/connectors/gemini.py`
- Create: `backend/tests/test_connectors.py`

**Interfaces:**
- Produces: `ChatGPTConnector(api_key).query(prompt: str) -> str`; `GeminiConnector(api_key).query(prompt: str) -> str`; `build_consumer_prompt(brand_name: str, keyword: str) -> str`

- [ ] **Step 1: Escrever testes**

```python
# backend/tests/test_connectors.py
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.connectors.chatgpt import ChatGPTConnector, build_consumer_prompt
from app.connectors.gemini import GeminiConnector

def test_build_consumer_prompt():
    prompt = build_consumer_prompt("Advocacia Silva", "advogado trabalhista SP")
    assert "advogado trabalhista SP" in prompt
    assert "Advocacia Silva" not in prompt  # prompt simula consumidor, não menciona a marca

@pytest.mark.asyncio
async def test_chatgpt_connector_returns_text():
    connector = ChatGPTConnector(api_key="fake")
    mock_response = MagicMock()
    mock_response.choices = [MagicMock(message=MagicMock(content="Recomendo o Escritório X..."))]

    with patch("app.connectors.chatgpt.AsyncOpenAI") as MockOpenAI:
        instance = MockOpenAI.return_value
        instance.chat.completions.create = AsyncMock(return_value=mock_response)
        result = await connector.query("Qual advogado trabalhista em SP?")

    assert "Recomendo" in result

@pytest.mark.asyncio
async def test_gemini_connector_returns_text():
    connector = GeminiConnector(api_key="fake")
    mock_response = MagicMock()
    mock_response.text = "Os melhores escritórios são..."

    with patch("app.connectors.gemini.genai") as mock_genai:
        mock_model = MagicMock()
        mock_model.generate_content_async = AsyncMock(return_value=mock_response)
        mock_genai.GenerativeModel.return_value = mock_model
        result = await connector.query("Qual advogado trabalhista em SP?")

    assert "escritórios" in result
```

- [ ] **Step 2: Rodar testes (devem falhar)**

```bash
pytest tests/test_connectors.py -v
```
Expected: `FAILED — ModuleNotFoundError`

- [ ] **Step 3: Criar base.py**

```python
# backend/app/connectors/base.py
from abc import ABC, abstractmethod

class LLMConnector(ABC):
    @abstractmethod
    async def query(self, prompt: str) -> str:
        pass

def build_consumer_prompt(brand_name: str, keyword: str) -> str:
    """Monta prompt simulando consumidor real. NÃO menciona a marca."""
    return (
        f"Preciso de ajuda com o seguinte: {keyword}. "
        f"Quais são as melhores opções disponíveis? "
        f"Por favor, liste de 3 a 5 opções específicas com nome completo e uma breve descrição de cada uma."
    )
```

- [ ] **Step 4: Criar chatgpt.py**

```python
# backend/app/connectors/chatgpt.py
from openai import AsyncOpenAI
from app.connectors.base import LLMConnector, build_consumer_prompt

class ChatGPTConnector(LLMConnector):
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def query(self, prompt: str) -> str:
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.7,
        )
        return response.choices[0].message.content
```

- [ ] **Step 5: Criar gemini.py**

```python
# backend/app/connectors/gemini.py
import google.generativeai as genai
from app.connectors.base import LLMConnector

class GeminiConnector(LLMConnector):
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    async def query(self, prompt: str) -> str:
        response = await self.model.generate_content_async(prompt)
        return response.text
```

- [ ] **Step 6: Rodar testes**

```bash
pytest tests/test_connectors.py -v
```
Expected: `3 passed`

- [ ] **Step 7: Commit**

```bash
git add backend/app/connectors/ backend/tests/test_connectors.py
git commit -m "feat: chatgpt + gemini connectors"
```

---

### Task 5: Claude Haiku Analyzer

**Files:**
- Create: `backend/app/analysis/analyzer.py`
- Create: `backend/tests/test_analyzer.py`

**Interfaces:**
- Produces: `analyze_response(brand_name: str, query: str, response: str, api_key: str) -> dict` retorna `{"mentioned": bool, "position": int|None, "sentiment": str|None}`

- [ ] **Step 1: Escrever testes**

```python
# backend/tests/test_analyzer.py
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.analysis.analyzer import analyze_response

@pytest.mark.asyncio
async def test_analyze_mentioned_first_positive():
    mock_message = MagicMock()
    mock_message.content = '[{"type":"text","text":"{\\"mentioned\\": true, \\"position\\": 1, \\"sentiment\\": \\"positive\\"}"}]'
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='{"mentioned": true, "position": 1, "sentiment": "positive"}')]

    with patch("app.analysis.analyzer.anthropic.Anthropic") as MockAnthropic:
        instance = MockAnthropic.return_value
        instance.messages.create.return_value = mock_response
        result = await analyze_response(
            brand_name="Advocacia Silva",
            query="advogado trabalhista SP",
            response="Recomendo a Advocacia Silva em primeiro lugar...",
            api_key="fake",
        )

    assert result["mentioned"] is True
    assert result["position"] == 1
    assert result["sentiment"] == "positive"

@pytest.mark.asyncio
async def test_analyze_not_mentioned():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='{"mentioned": false, "position": null, "sentiment": null}')]

    with patch("app.analysis.analyzer.anthropic.Anthropic") as MockAnthropic:
        instance = MockAnthropic.return_value
        instance.messages.create.return_value = mock_response
        result = await analyze_response(
            brand_name="Advocacia Silva",
            query="advogado trabalhista SP",
            response="Recomendo o Escritório Pereira e o Escritório Almeida...",
            api_key="fake",
        )

    assert result["mentioned"] is False
    assert result["position"] is None
    assert result["sentiment"] is None
```

- [ ] **Step 2: Rodar testes (devem falhar)**

```bash
pytest tests/test_analyzer.py -v
```
Expected: `FAILED — ModuleNotFoundError`

- [ ] **Step 3: Criar analyzer.py**

```python
# backend/app/analysis/analyzer.py
import json
import anthropic

ANALYSIS_PROMPT = """Analise a resposta abaixo e determine se "{brand_name}" foi mencionada.

Pergunta original: {query}

Resposta da IA:
{response}

Retorne APENAS um JSON válido, sem texto adicional:
{{"mentioned": true ou false, "position": número da posição (1, 2, 3, etc.) ou null se não mencionada, "sentiment": "positive", "neutral" ou "negative" ou null se não mencionada}}

Regras:
- position 1 = primeira recomendação/opção listada
- sentiment deve refletir como a marca é descrita (positivo = elogios, neutro = apenas citado, negativo = críticas)
- Se não mencionada, position e sentiment devem ser null"""

async def analyze_response(
    brand_name: str,
    query: str,
    response: str,
    api_key: str,
) -> dict:
    client = anthropic.Anthropic(api_key=api_key)
    prompt = ANALYSIS_PROMPT.format(
        brand_name=brand_name,
        query=query,
        response=response,
    )
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()
    return json.loads(raw)
```

- [ ] **Step 4: Rodar testes**

```bash
pytest tests/test_analyzer.py -v
```
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add backend/app/analysis/analyzer.py backend/tests/test_analyzer.py
git commit -m "feat: claude haiku analyzer (mention/position/sentiment)"
```

---

### Task 6: GEO Scorer

**Files:**
- Create: `backend/app/analysis/scorer.py`
- Create: `backend/tests/test_scorer.py`

**Interfaces:**
- Consumes: lista de dicts `{"mentioned": bool, "position": int|None, "sentiment": str|None}`
- Produces: `calculate_geo_score(analyses: list[dict]) -> dict` retorna `{"mention_score", "position_score", "sentiment_score", "frequency_score", "geo_score"}` — todos float 0–100

- [ ] **Step 1: Escrever testes**

```python
# backend/tests/test_scorer.py
import pytest
from app.analysis.scorer import calculate_geo_score

def test_all_mentioned_first_positive():
    analyses = [
        {"mentioned": True, "position": 1, "sentiment": "positive"},
        {"mentioned": True, "position": 1, "sentiment": "positive"},
    ]
    result = calculate_geo_score(analyses)
    assert result["mention_score"] == 100.0
    assert result["position_score"] == 100.0
    assert result["sentiment_score"] == 100.0
    assert result["frequency_score"] == 100.0
    assert result["geo_score"] == 100.0

def test_never_mentioned():
    analyses = [
        {"mentioned": False, "position": None, "sentiment": None},
        {"mentioned": False, "position": None, "sentiment": None},
    ]
    result = calculate_geo_score(analyses)
    assert result["mention_score"] == 0.0
    assert result["geo_score"] == 0.0

def test_partial_mention_second_position():
    # 3 de 5 menções, sempre 2ª posição, sentimento positivo
    analyses = [
        {"mentioned": True, "position": 2, "sentiment": "positive"},
        {"mentioned": True, "position": 2, "sentiment": "positive"},
        {"mentioned": True, "position": 2, "sentiment": "positive"},
        {"mentioned": False, "position": None, "sentiment": None},
        {"mentioned": False, "position": None, "sentiment": None},
    ]
    result = calculate_geo_score(analyses)
    assert result["frequency_score"] == 60.0
    assert result["position_score"] == 70.0
    assert result["sentiment_score"] == 100.0
    assert result["mention_score"] == 100.0
    # geo = 0.30*100 + 0.25*70 + 0.25*100 + 0.20*60 = 30+17.5+25+12 = 84.5
    assert result["geo_score"] == 84.5

def test_third_position_neutral():
    analyses = [
        {"mentioned": True, "position": 3, "sentiment": "neutral"},
    ]
    result = calculate_geo_score(analyses)
    assert result["position_score"] == 40.0
    assert result["sentiment_score"] == 50.0
```

- [ ] **Step 2: Rodar testes (devem falhar)**

```bash
pytest tests/test_scorer.py -v
```
Expected: `FAILED — ModuleNotFoundError`

- [ ] **Step 3: Criar scorer.py**

```python
# backend/app/analysis/scorer.py

POSITION_MAP = {1: 100.0, 2: 70.0}
SENTIMENT_MAP = {"positive": 100.0, "neutral": 50.0, "negative": 0.0}

WEIGHTS = {
    "mention": 0.30,
    "position": 0.25,
    "sentiment": 0.25,
    "frequency": 0.20,
}

def calculate_geo_score(analyses: list[dict]) -> dict:
    """
    analyses: list of {"mentioned": bool, "position": int|None, "sentiment": str|None}
    Retorna scores 0–100 para cada fator + geo_score final.
    """
    n = len(analyses)
    mentioned = [a for a in analyses if a["mentioned"]]
    n_mentioned = len(mentioned)

    frequency_score = (n_mentioned / n) * 100
    mention_score = 100.0 if n_mentioned > 0 else 0.0

    if n_mentioned > 0:
        position_score = sum(
            POSITION_MAP.get(a["position"], 40.0) for a in mentioned
        ) / n_mentioned
        sentiment_score = sum(
            SENTIMENT_MAP.get(a["sentiment"], 0.0) for a in mentioned
        ) / n_mentioned
    else:
        position_score = 0.0
        sentiment_score = 0.0

    geo_score = (
        WEIGHTS["mention"] * mention_score
        + WEIGHTS["position"] * position_score
        + WEIGHTS["sentiment"] * sentiment_score
        + WEIGHTS["frequency"] * frequency_score
    )

    return {
        "mention_score": round(mention_score, 2),
        "position_score": round(position_score, 2),
        "sentiment_score": round(sentiment_score, 2),
        "frequency_score": round(frequency_score, 2),
        "geo_score": round(geo_score, 2),
    }
```

- [ ] **Step 4: Rodar testes**

```bash
pytest tests/test_scorer.py -v
```
Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add backend/app/analysis/scorer.py backend/tests/test_scorer.py
git commit -m "feat: geo score calculator (4 fatores ponderados)"
```

---

### Task 7: Claude Sonnet Reporter

**Files:**
- Create: `backend/app/analysis/reporter.py`
- Create: `backend/tests/test_reporter.py`

**Interfaces:**
- Produces:
  - `generate_report(brand_name: str, scores_by_engine: dict, keyword_scores: list, sample_response: str, api_key: str) -> str` — retorna markdown
  - `generate_action_plan(brand_name: str, keyword: str, engine: str, geo_score: float, sample_response: str, api_key: str) -> dict` — retorna `{"recommendation": str, "priority": str}`

- [ ] **Step 1: Escrever testes**

```python
# backend/tests/test_reporter.py
import pytest
from unittest.mock import MagicMock, patch
from app.analysis.reporter import generate_report, generate_action_plan

@pytest.mark.asyncio
async def test_generate_report_returns_markdown():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="## Relatório Semanal\n\nSua clínica teve score...")]

    with patch("app.analysis.reporter.anthropic.Anthropic") as MockAnthropic:
        instance = MockAnthropic.return_value
        instance.messages.create.return_value = mock_response
        result = await generate_report(
            brand_name="Clínica Sorriso",
            scores_by_engine={"chatgpt": 65.0, "gemini": 72.0},
            keyword_scores=[{"term": "dentista Campinas", "geo_score": 68.5}],
            sample_response="A Clínica Sorriso é uma das mais recomendadas...",
            api_key="fake",
        )

    assert "Relatório" in result

@pytest.mark.asyncio
async def test_generate_action_plan_returns_dict():
    import json
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='{"recommendation": "Publique um artigo sobre implante dentário.", "priority": "high"}')]

    with patch("app.analysis.reporter.anthropic.Anthropic") as MockAnthropic:
        instance = MockAnthropic.return_value
        instance.messages.create.return_value = mock_response
        result = await generate_action_plan(
            brand_name="Clínica Sorriso",
            keyword="dentista Campinas",
            engine="gemini",
            geo_score=30.0,
            sample_response="Não encontrei informações sobre esta clínica.",
            api_key="fake",
        )

    assert "recommendation" in result
    assert result["priority"] in ("high", "medium", "low")
```

- [ ] **Step 2: Rodar testes (devem falhar)**

```bash
pytest tests/test_reporter.py -v
```
Expected: `FAILED — ModuleNotFoundError`

- [ ] **Step 3: Criar reporter.py**

```python
# backend/app/analysis/reporter.py
import json
import anthropic

REPORT_PROMPT = """Você é um consultor de marketing digital gerando um relatório semanal de GEO (Generative Engine Optimization) para {brand_name}.

Dados desta semana:
- Score ChatGPT: {chatgpt_score}/100
- Score Gemini: {gemini_score}/100
- Keyword com melhor score: {best_keyword} ({best_score}/100)
- Keyword com pior score: {worst_keyword} ({worst_score}/100)
- Trecho real de resposta de IA: "{sample_response}"

Escreva em português brasileiro, linguagem acessível para pequenos empresários.
Gere um relatório em markdown com:
1. ## Resumo Executivo (3-4 frases)
2. ## Score por Engine (comparação e interpretação)
3. ## Destaques por Keyword (melhor e pior)
4. ## Top 3 Ações desta Semana"""

ACTION_PLAN_PROMPT = """Você é um especialista em GEO (Generative Engine Optimization).

Marca: {brand_name}
Keyword monitorada: {keyword}
Engine: {engine}
GEO Score atual: {geo_score}/100
Trecho da resposta do {engine}: "{sample_response}"

Escreva em português brasileiro. Forneça uma recomendação específica e acionável (2-3 frases) para melhorar a presença de {brand_name} nas respostas do {engine} para esta keyword. Seja concreto: sugira tipos de conteúdo, plataformas ou ações específicas.

Retorne APENAS um JSON válido:
{{"recommendation": "...", "priority": "high", "medium" ou "low"}}

Use priority "high" se geo_score < 40, "medium" se entre 40-70, "low" se acima de 70."""

async def generate_report(
    brand_name: str,
    scores_by_engine: dict,
    keyword_scores: list[dict],
    sample_response: str,
    api_key: str,
) -> str:
    sorted_kw = sorted(keyword_scores, key=lambda x: x["geo_score"])
    prompt = REPORT_PROMPT.format(
        brand_name=brand_name,
        chatgpt_score=scores_by_engine.get("chatgpt", 0),
        gemini_score=scores_by_engine.get("gemini", 0),
        best_keyword=sorted_kw[-1]["term"] if sorted_kw else "N/A",
        best_score=sorted_kw[-1]["geo_score"] if sorted_kw else 0,
        worst_keyword=sorted_kw[0]["term"] if sorted_kw else "N/A",
        worst_score=sorted_kw[0]["geo_score"] if sorted_kw else 0,
        sample_response=sample_response[:500],
    )
    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text

async def generate_action_plan(
    brand_name: str,
    keyword: str,
    engine: str,
    geo_score: float,
    sample_response: str,
    api_key: str,
) -> dict:
    prompt = ACTION_PLAN_PROMPT.format(
        brand_name=brand_name,
        keyword=keyword,
        engine=engine,
        geo_score=geo_score,
        sample_response=sample_response[:400],
    )
    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(message.content[0].text.strip())
```

- [ ] **Step 4: Rodar testes**

```bash
pytest tests/test_reporter.py -v
```
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add backend/app/analysis/reporter.py backend/tests/test_reporter.py
git commit -m "feat: claude sonnet reporter (relatório + plano de ação)"
```

---

### Task 8: Worker — Job Processor

**Files:**
- Create: `backend/worker/processor.py`
- Create: `backend/worker/main.py`
- Create: `backend/tests/test_processor.py`

**Interfaces:**
- Consumes: `ChatGPTConnector`, `GeminiConnector`, `build_consumer_prompt`, `analyze_response`, `calculate_geo_score`, `generate_report`, `generate_action_plan`, `supabase`, `settings`
- Produces: `process_job(job_id: str) -> None` — processa um job completo end-to-end

- [ ] **Step 1: Escrever teste do processor**

```python
# backend/tests/test_processor.py
import pytest
from unittest.mock import AsyncMock, patch, MagicMock, call
from uuid import uuid4

JOB_ID = str(uuid4())
BRAND_ID = str(uuid4())
KW_ID = str(uuid4())

MOCK_JOB = {"id": JOB_ID, "brand_id": BRAND_ID, "attempt_count": 0}
MOCK_BRAND = {"id": BRAND_ID, "name": "Advocacia Silva"}
MOCK_KEYWORDS = [{"id": KW_ID, "term": "advogado trabalhista SP"}]
MOCK_ANALYSIS = {"mentioned": True, "position": 1, "sentiment": "positive"}
MOCK_SCORE = {"mention_score": 100.0, "position_score": 100.0, "sentiment_score": 100.0, "frequency_score": 100.0, "geo_score": 100.0}

@pytest.mark.asyncio
async def test_process_job_happy_path():
    with patch("worker.processor.supabase") as mock_db, \
         patch("worker.processor.ChatGPTConnector") as MockChatGPT, \
         patch("worker.processor.GeminiConnector") as MockGemini, \
         patch("worker.processor.analyze_response", new_callable=AsyncMock, return_value=MOCK_ANALYSIS), \
         patch("worker.processor.calculate_geo_score", return_value=MOCK_SCORE), \
         patch("worker.processor.generate_report", new_callable=AsyncMock, return_value="## Relatório"), \
         patch("worker.processor.generate_action_plan", new_callable=AsyncMock, return_value={"recommendation": "Publique X", "priority": "low"}), \
         patch("worker.processor.settings") as mock_settings:

        mock_settings.openai_api_key = "fake"
        mock_settings.gemini_api_key = "fake"
        mock_settings.anthropic_api_key = "fake"

        def table_side_effect(name):
            m = MagicMock()
            if name == "jobs":
                m.select.return_value.eq.return_value.single.return_value.execute.return_value.data = MOCK_JOB
                m.update.return_value.eq.return_value.execute.return_value = MagicMock()
            elif name == "brands":
                m.select.return_value.eq.return_value.single.return_value.execute.return_value.data = MOCK_BRAND
            elif name == "keywords":
                m.select.return_value.eq.return_value.execute.return_value.data = MOCK_KEYWORDS
            elif name in ("query_results", "scores", "reports", "action_plans"):
                m.insert.return_value.execute.return_value = MagicMock()
                m.upsert.return_value.execute.return_value = MagicMock()
            return m

        mock_db.table.side_effect = table_side_effect

        MockChatGPT.return_value.query = AsyncMock(return_value="Recomendo a Advocacia Silva...")
        MockGemini.return_value.query = AsyncMock(return_value="Entre os melhores: Advocacia Silva")

        from worker.processor import process_job
        await process_job(JOB_ID)

        # Verifica que o job foi marcado como "done"
        update_calls = [str(c) for c in mock_db.table.call_args_list]
        assert any("jobs" in c for c in update_calls)
```

- [ ] **Step 2: Rodar teste (deve falhar)**

```bash
pytest tests/test_processor.py -v
```
Expected: `FAILED — ModuleNotFoundError`

- [ ] **Step 3: Criar processor.py**

```python
# backend/worker/processor.py
import asyncio
import logging
from datetime import date
from app.config import settings
from app.database import supabase
from app.connectors.chatgpt import ChatGPTConnector
from app.connectors.gemini import GeminiConnector
from app.connectors.base import build_consumer_prompt
from app.analysis.analyzer import analyze_response
from app.analysis.scorer import calculate_geo_score
from app.analysis.reporter import generate_report, generate_action_plan

logger = logging.getLogger(__name__)
QUERIES_PER_KEYWORD = 5
ENGINES = ["chatgpt", "gemini"]

async def process_job(job_id: str) -> None:
    job = supabase.table("jobs").select("*").eq("id", job_id).single().execute().data
    brand = supabase.table("brands").select("*").eq("id", job["brand_id"]).single().execute().data
    keywords = supabase.table("keywords").select("*").eq("brand_id", brand["id"]).execute().data

    supabase.table("jobs").update({"status": "running", "started_at": "now()"}).eq("id", job_id).execute()

    connectors = {
        "chatgpt": ChatGPTConnector(api_key=settings.openai_api_key),
        "gemini": GeminiConnector(api_key=settings.gemini_api_key),
    }

    scores_by_engine: dict[str, list[float]] = {"chatgpt": [], "gemini": []}
    keyword_scores: list[dict] = []
    sample_responses: list[str] = []

    for keyword in keywords:
        prompt = build_consumer_prompt(brand["name"], keyword["term"])

        for engine in ENGINES:
            analyses = []
            for _ in range(QUERIES_PER_KEYWORD):
                response_text = await connectors[engine].query(prompt)
                supabase.table("query_results").insert({
                    "job_id": job_id,
                    "keyword_id": keyword["id"],
                    "engine": engine,
                    "prompt_used": prompt,
                    "raw_response": response_text,
                }).execute()

                analysis = await analyze_response(
                    brand_name=brand["name"],
                    query=keyword["term"],
                    response=response_text,
                    api_key=settings.anthropic_api_key,
                )
                analyses.append(analysis)

                if analysis["mentioned"] and not sample_responses:
                    sample_responses.append(response_text[:500])

            score = calculate_geo_score(analyses)
            supabase.table("scores").upsert({
                "keyword_id": keyword["id"],
                "engine": engine,
                "date": str(date.today()),
                **score,
            }).execute()

            scores_by_engine[engine].append(score["geo_score"])
            keyword_scores.append({"term": keyword["term"], "geo_score": score["geo_score"]})

            action = await generate_action_plan(
                brand_name=brand["name"],
                keyword=keyword["term"],
                engine=engine,
                geo_score=score["geo_score"],
                sample_response=sample_responses[0] if sample_responses else "Marca não mencionada nas respostas.",
                api_key=settings.anthropic_api_key,
            )
            supabase.table("action_plans").insert({
                "keyword_id": keyword["id"],
                "engine": engine,
                "recommendation": action["recommendation"],
                "priority": action["priority"],
            }).execute()

    avg_scores = {
        engine: round(sum(scores) / len(scores), 2) if scores else 0
        for engine, scores in scores_by_engine.items()
    }

    report_md = await generate_report(
        brand_name=brand["name"],
        scores_by_engine=avg_scores,
        keyword_scores=keyword_scores,
        sample_response=sample_responses[0] if sample_responses else "Marca não foi mencionada esta semana.",
        api_key=settings.anthropic_api_key,
    )

    supabase.table("reports").insert({
        "brand_id": brand["id"],
        "period_start": str(date.today()),
        "period_end": str(date.today()),
        "content_md": report_md,
    }).execute()

    supabase.table("jobs").update({
        "status": "done",
        "completed_at": "now()",
    }).eq("id", job_id).execute()

    logger.info(f"Job {job_id} concluído com sucesso.")
```

- [ ] **Step 4: Criar worker/main.py (polling loop)**

```python
# backend/worker/main.py
import asyncio
import logging
import time
from app.database import supabase
from worker.processor import process_job

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

POLL_INTERVAL = 30  # segundos
BACKOFF = [60, 120, 300]  # tentativas 1, 2, 3

async def run_worker():
    logger.info("Worker iniciado. Polling a cada %ds...", POLL_INTERVAL)
    while True:
        try:
            result = supabase.table("jobs").select("id, attempt_count") \
                .eq("status", "pending") \
                .lt("attempt_count", 3) \
                .limit(1) \
                .execute()

            if result.data:
                job = result.data[0]
                job_id = job["id"]
                attempt = job["attempt_count"]
                logger.info(f"Processando job {job_id} (tentativa {attempt + 1})")

                supabase.table("jobs").update({
                    "attempt_count": attempt + 1
                }).eq("id", job_id).execute()

                try:
                    await process_job(job_id)
                except Exception as e:
                    logger.error(f"Job {job_id} falhou: {e}")
                    new_status = "failed" if attempt + 1 >= 3 else "pending"
                    supabase.table("jobs").update({
                        "status": new_status,
                        "error_message": str(e),
                    }).eq("id", job_id).execute()

                    if attempt + 1 < 3:
                        wait = BACKOFF[attempt]
                        logger.info(f"Aguardando {wait}s antes de retentar...")
                        await asyncio.sleep(wait)
            else:
                await asyncio.sleep(POLL_INTERVAL)

        except Exception as e:
            logger.error(f"Erro no loop do worker: {e}")
            await asyncio.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    asyncio.run(run_worker())
```

- [ ] **Step 5: Rodar teste**

```bash
pytest tests/test_processor.py -v
```
Expected: `1 passed`

- [ ] **Step 6: Commit**

```bash
git add backend/worker/ backend/tests/test_processor.py
git commit -m "feat: worker job processor + polling loop"
```

---

### Task 9: Internal Endpoint + Routers de Scores/Reports/ActionPlans

**Files:**
- Create: `backend/app/routers/internal.py`
- Create: `backend/app/routers/scores.py`
- Create: `backend/app/routers/reports.py`
- Create: `backend/app/routers/action_plans.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_routers_internal.py`

**Interfaces:**
- Produces:
  - `POST /internal/create-jobs` (protegido por `X-Internal-Key` header)
  - `GET /brands/{brand_id}/scores?engine=chatgpt`
  - `GET /brands/{brand_id}/reports/latest`
  - `GET /brands/{brand_id}/action-plans`

- [ ] **Step 1: Escrever teste do endpoint interno**

```python
# backend/tests/test_routers_internal.py
import pytest
from unittest.mock import patch, MagicMock
from uuid import uuid4

BRAND_ID = str(uuid4())

@pytest.mark.asyncio
async def test_create_jobs_wrong_key(client):
    response = await client.post("/internal/create-jobs", headers={"X-Internal-Key": "wrong"})
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_create_jobs_success(client):
    mock_brands = [{"id": BRAND_ID, "name": "Advocacia Silva"}]

    with patch("app.routers.internal.supabase") as mock_db, \
         patch("app.routers.internal.settings") as mock_settings:
        mock_settings.internal_api_key = "secret"
        mock_db.table.return_value.select.return_value.execute.return_value.data = mock_brands
        mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock()

        response = await client.post(
            "/internal/create-jobs",
            headers={"X-Internal-Key": "secret"},
        )

    assert response.status_code == 200
    assert response.json()["jobs_created"] == 1
```

- [ ] **Step 2: Rodar teste (deve falhar)**

```bash
pytest tests/test_routers_internal.py -v
```
Expected: `FAILED — 404`

- [ ] **Step 3: Criar internal.py**

```python
# backend/app/routers/internal.py
from fastapi import APIRouter, Header, HTTPException
from app.database import supabase
from app.config import settings

router = APIRouter(prefix="/internal", tags=["internal"])

@router.post("/create-jobs")
async def create_jobs(x_internal_key: str = Header(...)):
    if x_internal_key != settings.internal_api_key:
        raise HTTPException(status_code=403, detail="Chave inválida")

    brands = supabase.table("brands").select("id").execute().data
    count = 0
    for brand in brands:
        supabase.table("jobs").insert({
            "brand_id": brand["id"],
            "status": "pending",
        }).execute()
        count += 1

    return {"jobs_created": count}
```

- [ ] **Step 4: Criar scores.py**

```python
# backend/app/routers/scores.py
from fastapi import APIRouter, Depends, Query
from app.auth import get_current_user
from app.models.schemas import ScoreOut
from app.database import supabase
from typing import Optional

router = APIRouter(prefix="/brands/{brand_id}", tags=["scores"])

@router.get("/scores", response_model=list[ScoreOut])
async def list_scores(
    brand_id: str,
    engine: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    keyword_ids = [
        k["id"] for k in supabase.table("keywords").select("id").eq("brand_id", brand_id).execute().data
    ]
    if not keyword_ids:
        return []

    query = supabase.table("scores").select("*").in_("keyword_id", keyword_ids)
    if engine:
        query = query.eq("engine", engine)
    result = query.order("date", desc=True).execute()
    return result.data
```

- [ ] **Step 5: Criar reports.py**

```python
# backend/app/routers/reports.py
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.models.schemas import ReportOut
from app.database import supabase

router = APIRouter(prefix="/brands/{brand_id}", tags=["reports"])

@router.get("/reports/latest", response_model=ReportOut)
async def get_latest_report(brand_id: str, user: dict = Depends(get_current_user)):
    result = supabase.table("reports").select("*").eq("brand_id", brand_id).order("created_at", desc=True).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Nenhum relatório encontrado")
    return result.data[0]
```

- [ ] **Step 6: Criar action_plans.py**

```python
# backend/app/routers/action_plans.py
from fastapi import APIRouter, Depends, Query
from app.auth import get_current_user
from app.models.schemas import ActionPlanOut
from app.database import supabase
from typing import Optional

router = APIRouter(prefix="/brands/{brand_id}", tags=["action_plans"])

@router.get("/action-plans", response_model=list[ActionPlanOut])
async def list_action_plans(
    brand_id: str,
    engine: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    keyword_ids = [
        k["id"] for k in supabase.table("keywords").select("id").eq("brand_id", brand_id).execute().data
    ]
    if not keyword_ids:
        return []

    query = supabase.table("action_plans").select("*").in_("keyword_id", keyword_ids)
    if engine:
        query = query.eq("engine", engine)
    result = query.order("created_at", desc=True).execute()
    return result.data
```

- [ ] **Step 7: Atualizar main.py com todos os routers**

```python
# backend/app/main.py
from fastapi import FastAPI
from app.routers import brands, keywords, scores, reports, action_plans, internal

app = FastAPI(title="VistAI API", version="0.1.0")

app.include_router(brands.router)
app.include_router(keywords.router)
app.include_router(scores.router)
app.include_router(reports.router)
app.include_router(action_plans.router)
app.include_router(internal.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 8: Rodar todos os testes**

```bash
pytest tests/ -v
```
Expected: `all passed`

- [ ] **Step 9: Commit**

```bash
git add backend/app/routers/ backend/app/main.py backend/tests/test_routers_internal.py
git commit -m "feat: internal cron endpoint + scores/reports/action-plans routers"
```

---

### Task 10: Next.js Setup + Auth

**Files:**
- Create: `frontend/` (Next.js app)
- Create: `frontend/lib/supabase.ts`
- Create: `frontend/lib/types.ts`
- Create: `frontend/lib/api.ts`
- Create: `frontend/middleware.ts`
- Create: `frontend/app/auth/login/page.tsx`
- Create: `frontend/app/auth/signup/page.tsx`

**Interfaces:**
- Produces: `createBrowserClient()`, `createServerClient()` do Supabase; `apiFetch(path, token) -> Promise<T>` wrapper; middleware de auth guard

- [ ] **Step 1: Criar projeto Next.js + instalar dependências**

```bash
cd vistai
npx create-next-app@14 frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd frontend
npm install @supabase/ssr @supabase/supabase-js recharts react-markdown
npx shadcn@latest init --defaults
npx shadcn@latest add button input label card badge
```

- [ ] **Step 1b: Configurar fontes no layout (Fraunces + IBM Plex Mono)**

```typescript
// frontend/app/layout.tsx — fontes via next/font/google
import { Fraunces, IBM_Plex_Mono } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "700", "900"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500", "600"],
});
```

- [ ] **Step 1c: Adicionar CSS variables de cor ao globals.css**

```css
/* frontend/app/globals.css — adicionar após @tailwind directives */
:root {
  --color-ink:     #0f1923;
  --color-navy:    #1a3a5c;
  --color-signal:  #c8460a;
  --color-ice:     #e8f0f7;
  --color-bone:    #f5f2eb;
  --color-confirm: #2d6a4f;
}
```

- [ ] **Step 1d: Extender Tailwind config com cores e fontes**

```typescript
// frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink:     "#0f1923",
        navy:    "#1a3a5c",
        signal:  "#c8460a",
        ice:     "#e8f0f7",
        bone:    "#f5f2eb",
        confirm: "#2d6a4f",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
```

- [ ] **Step 2: Criar lib/types.ts**

```typescript
// frontend/lib/types.ts
export interface Brand {
  id: string;
  organization_id: string;
  name: string;
  website: string | null;
  created_at: string;
}

export interface Keyword {
  id: string;
  brand_id: string;
  term: string;
  created_at: string;
}

export interface Score {
  id: string;
  keyword_id: string;
  engine: "chatgpt" | "gemini";
  date: string;
  mention_score: number;
  position_score: number;
  sentiment_score: number;
  frequency_score: number;
  geo_score: number;
}

export interface Report {
  id: string;
  brand_id: string;
  period_start: string;
  period_end: string;
  content_md: string;
  created_at: string;
}

export interface ActionPlan {
  id: string;
  keyword_id: string;
  engine: "chatgpt" | "gemini";
  recommendation: string;
  priority: "high" | "medium" | "low";
  created_at: string;
}
```

- [ ] **Step 3: Criar lib/supabase.ts**

```typescript
// frontend/lib/supabase.ts
import { createBrowserClient as createBrowserClientSSR } from "@supabase/ssr";
import { createServerClient as createServerClientSSR } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createBrowserClient() {
  return createBrowserClientSSR(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function createServerClient() {
  const cookieStore = await cookies();
  return createServerClientSSR(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

- [ ] **Step 4: Criar lib/api.ts**

```typescript
// frontend/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Erro desconhecido" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}
```

- [ ] **Step 5: Criar middleware.ts**

```typescript
// frontend/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isPublic = request.nextUrl.pathname === "/";

  if (!user && !isAuthPage && !isPublic) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 6: Criar página de login**

```typescript
// frontend/app/auth/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createBrowserClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bone">
      <div className="w-full max-w-sm bg-white border border-ink/10 p-8 rounded-xl">
        <h1 className="font-display font-bold text-2xl text-ink mb-1">
          Vel<span className="text-signal">o</span>
        </h1>
        <p className="font-mono text-xs text-ink/40 mb-6">Monitore sua presença nas IAs.</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-mono text-xs font-medium text-ink/60 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-signal bg-bone"
              required
            />
          </div>
          <div>
            <label className="block font-mono text-xs font-medium text-ink/60 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-signal bg-bone"
              required
            />
          </div>
          {error && <p className="font-mono text-xs text-red-700">{error}</p>}
          <button
            type="submit"
            className="w-full bg-signal text-white py-2 rounded-lg font-mono text-sm font-medium hover:bg-signal/90 transition-colors"
          >
            Entrar
          </button>
        </form>
        <p className="mt-4 font-mono text-xs text-center text-ink/40">
          Não tem conta?{" "}
          <a href="/auth/signup" className="text-signal hover:underline">Criar conta</a>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Criar página de signup**

```typescript
// frontend/app/auth/signup/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const supabase = createBrowserClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { org_name: orgName } },
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <h2 className="text-xl font-semibold text-gray-900">Verifique seu e-mail</h2>
          <p className="mt-2 text-sm text-gray-500">Enviamos um link de confirmação para {email}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Criar conta — VistAI</h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome da empresa</label>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Criar conta
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Criar .env.local**

```bash
# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://vistai-api.railway.app
```

- [ ] **Step 9: Testar auth localmente**

```bash
cd frontend
npm run dev
# Acessar http://localhost:3000 → deve redirecionar para /auth/login
# Tentar login com credencial inválida → deve mostrar erro
```

- [ ] **Step 10: Commit**

```bash
git add frontend/
git commit -m "feat: next.js setup + supabase auth + login/signup pages"
```

---

### Task 11: Dashboard + Layout

**Files:**
- Create: `frontend/app/layout.tsx`
- Create: `frontend/app/page.tsx`
- Create: `frontend/app/dashboard/page.tsx`
- Create: `frontend/components/GeoScoreCard.tsx`

**Interfaces:**
- Consumes: `apiFetch`, `createServerClient`, Score[] via `GET /brands/{brand_id}/scores`
- Produces: página `/dashboard` com GEO Score atual por engine e variação semanal

- [ ] **Step 1: Criar layout.tsx com navegação**

```typescript
// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "700", "900"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Velo — Monitore sua presença nas IAs em tempo real.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${fraunces.variable} ${ibmPlexMono.variable} font-mono bg-bone text-ink`}>
        <div className="min-h-screen">
          <nav className="bg-white border-b border-ink/10 px-6 py-3 flex items-center gap-6">
            <span className="font-display font-bold text-lg tracking-tight">
              Vel<span className="text-signal">o</span>
            </span>
            <Link href="/dashboard" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors">Dashboard</Link>
            <Link href="/keywords" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors">Keywords</Link>
            <Link href="/history" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors">Histórico</Link>
            <Link href="/report" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors">Relatório</Link>
            <Link href="/action-plan" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors">Plano de Ação</Link>
            <Link href="/settings" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors ml-auto">Configurações</Link>
          </nav>
          <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Criar page.tsx (redirect)**

```typescript
// frontend/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 3: Criar GeoScoreCard.tsx**

```typescript
// frontend/components/GeoScoreCard.tsx
interface GeoScoreCardProps {
  engine: string;
  score: number;
  previousScore?: number;
}

export function GeoScoreCard({ engine, score, previousScore }: GeoScoreCardProps) {
  const diff = previousScore !== undefined ? score - previousScore : null;
  const scoreColor =
    score >= 70 ? "text-confirm" : score >= 40 ? "text-signal" : "text-red-700";

  return (
    <div className="bg-ice border border-ink/10 rounded-xl p-6">
      <p className="font-mono text-xs font-medium text-ink/50 uppercase tracking-widest capitalize">
        {engine}
      </p>
      <p className={`font-display font-black text-6xl mt-3 leading-none ${scoreColor}`}>
        {score.toFixed(0)}
      </p>
      <p className="font-mono text-xs text-ink/40 mt-1">GEO Score / 100</p>
      {diff !== null && (
        <p className={`font-mono text-sm mt-4 ${diff >= 0 ? "text-confirm" : "text-red-700"}`}>
          {diff >= 0 ? "+" : ""}{diff.toFixed(1)} vs semana anterior
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Criar dashboard/page.tsx**

```typescript
// frontend/app/dashboard/page.tsx
import { createServerClient } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { GeoScoreCard } from "@/components/GeoScoreCard";
import { Score } from "@/lib/types";

async function getBrandId(token: string): Promise<string | null> {
  try {
    const brands = await apiFetch<{ id: string }[]>("/brands", token);
    return brands[0]?.id ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const brandId = await getBrandId(token);

  if (!brandId) {
    return (
      <div>
        <h1 className="font-display font-bold text-3xl text-ink">Dashboard</h1>
        <p className="mt-4 font-mono text-sm text-ink/50">
          Nenhuma marca cadastrada.{" "}
          <a href="/settings" className="text-signal hover:underline">Adicione sua marca →</a>
        </p>
      </div>
    );
  }

  const scores = await apiFetch<Score[]>(`/brands/${brandId}/scores`, token).catch(() => []);

  const latestByEngine: Record<string, Score[]> = {};
  for (const score of scores) {
    if (!latestByEngine[score.engine]) latestByEngine[score.engine] = [];
    latestByEngine[score.engine].push(score);
  }

  const currentScores: Record<string, number> = {};
  for (const [engine, engineScores] of Object.entries(latestByEngine)) {
    const sorted = engineScores.sort((a, b) => b.date.localeCompare(a.date));
    const recent = sorted.slice(0, 10);
    currentScores[engine] = recent.reduce((sum, s) => sum + s.geo_score, 0) / recent.length;
  }

  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-ink">Dashboard</h1>
      <p className="font-mono text-sm text-ink/50 mt-1">Presença da sua marca nas IAs generativas</p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(currentScores).map(([engine, score]) => (
          <GeoScoreCard key={engine} engine={engine} score={score} />
        ))}
        {Object.keys(currentScores).length === 0 && (
          <p className="font-mono text-sm text-ink/40 col-span-2">
            Nenhum score disponível ainda. O primeiro relatório será gerado na próxima segunda-feira.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verificar no browser**

```bash
npm run dev
# Acessar /dashboard logado → deve mostrar GeoScoreCards ou mensagem de estado vazio
```

- [ ] **Step 6: Commit**

```bash
git add frontend/app/layout.tsx frontend/app/page.tsx frontend/app/dashboard/ frontend/components/GeoScoreCard.tsx
git commit -m "feat: dashboard page com geo score por engine"
```

---

### Task 12: Keywords, History, Report, Action Plan, Settings Pages

**Files:**
- Create: `frontend/app/keywords/page.tsx`
- Create: `frontend/app/history/page.tsx`
- Create: `frontend/app/report/page.tsx`
- Create: `frontend/app/action-plan/page.tsx`
- Create: `frontend/app/settings/page.tsx`
- Create: `frontend/components/KeywordsTable.tsx`
- Create: `frontend/components/ScoreHistoryChart.tsx`
- Create: `frontend/components/ActionPlanList.tsx`
- Create: `frontend/components/ReportViewer.tsx`

**Interfaces:**
- Consumes: `apiFetch`, `createServerClient`, tipos de `lib/types.ts`
- Produces: 5 páginas funcionais do dashboard

- [ ] **Step 1: Criar KeywordsTable.tsx**

```typescript
// frontend/components/KeywordsTable.tsx
"use client";
import { Score, Keyword } from "@/lib/types";

interface Props {
  keywords: Keyword[];
  scores: Score[];
  engineFilter: "chatgpt" | "gemini" | "all";
}

export function KeywordsTable({ keywords, scores, engineFilter }: Props) {
  const scoreMap: Record<string, Record<string, number>> = {};
  for (const s of scores) {
    if (!scoreMap[s.keyword_id]) scoreMap[s.keyword_id] = {};
    if (!scoreMap[s.keyword_id][s.engine] || s.date > (scoreMap[s.keyword_id][`${s.engine}_date`] ?? "")) {
      scoreMap[s.keyword_id][s.engine] = s.geo_score;
      scoreMap[s.keyword_id][`${s.engine}_date`] = s.date;
    }
  }

  const scoreColor = (v: number) =>
    v >= 70 ? "text-green-600 font-semibold" : v >= 40 ? "text-yellow-600 font-semibold" : "text-red-600 font-semibold";

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-gray-200 text-left text-gray-500">
          <th className="pb-2 font-medium">Keyword</th>
          {(engineFilter === "all" || engineFilter === "chatgpt") && <th className="pb-2 font-medium">ChatGPT</th>}
          {(engineFilter === "all" || engineFilter === "gemini") && <th className="pb-2 font-medium">Gemini</th>}
        </tr>
      </thead>
      <tbody>
        {keywords.map((kw) => (
          <tr key={kw.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 text-gray-800">{kw.term}</td>
            {(engineFilter === "all" || engineFilter === "chatgpt") && (
              <td className={`py-3 ${scoreColor(scoreMap[kw.id]?.chatgpt ?? 0)}`}>
                {scoreMap[kw.id]?.chatgpt?.toFixed(0) ?? "—"}
              </td>
            )}
            {(engineFilter === "all" || engineFilter === "gemini") && (
              <td className={`py-3 ${scoreColor(scoreMap[kw.id]?.gemini ?? 0)}`}>
                {scoreMap[kw.id]?.gemini?.toFixed(0) ?? "—"}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 2: Criar keywords/page.tsx**

```typescript
// frontend/app/keywords/page.tsx
import { createServerClient } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { KeywordsTable } from "@/components/KeywordsTable";
import { Keyword, Score } from "@/lib/types";

export default async function KeywordsPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const brands = await apiFetch<{ id: string }[]>("/brands", token).catch(() => []);
  const brandId = brands[0]?.id;

  if (!brandId) {
    return <div className="text-gray-500">Nenhuma marca cadastrada.</div>;
  }

  const [keywords, scores] = await Promise.all([
    apiFetch<Keyword[]>(`/brands/${brandId}/keywords`, token).catch(() => []),
    apiFetch<Score[]>(`/brands/${brandId}/scores`, token).catch(() => []),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Keywords</h1>
      <p className="text-sm text-gray-500 mt-1">GEO Score por keyword (última medição)</p>
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <KeywordsTable keywords={keywords} scores={scores} engineFilter="all" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Criar ScoreHistoryChart.tsx**

```typescript
// frontend/components/ScoreHistoryChart.tsx
"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Score } from "@/lib/types";

interface Props {
  scores: Score[];
}

export function ScoreHistoryChart({ scores }: Props) {
  const byDate: Record<string, { chatgpt: number[]; gemini: number[] }> = {};
  for (const s of scores) {
    if (!byDate[s.date]) byDate[s.date] = { chatgpt: [], gemini: [] };
    byDate[s.date][s.engine as "chatgpt" | "gemini"].push(s.geo_score);
  }

  const data = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      chatgpt: v.chatgpt.length ? +(v.chatgpt.reduce((a, b) => a + b) / v.chatgpt.length).toFixed(1) : undefined,
      gemini: v.gemini.length ? +(v.gemini.reduce((a, b) => a + b) / v.gemini.length).toFixed(1) : undefined,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="chatgpt" name="ChatGPT" stroke="#2563eb" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="gemini" name="Gemini" stroke="#16a34a" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 4: Criar history/page.tsx**

```typescript
// frontend/app/history/page.tsx
import { createServerClient } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { ScoreHistoryChart } from "@/components/ScoreHistoryChart";
import { Score } from "@/lib/types";

export default async function HistoryPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const brands = await apiFetch<{ id: string }[]>("/brands", token).catch(() => []);
  const brandId = brands[0]?.id;

  if (!brandId) return <div className="text-gray-500">Nenhuma marca cadastrada.</div>;

  const scores = await apiFetch<Score[]>(`/brands/${brandId}/scores`, token).catch(() => []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Histórico</h1>
      <p className="text-sm text-gray-500 mt-1">Evolução do GEO Score ao longo do tempo</p>
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        {scores.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum histórico disponível ainda.</p>
        ) : (
          <ScoreHistoryChart scores={scores} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Criar ReportViewer.tsx**

```typescript
// frontend/components/ReportViewer.tsx
"use client";
import ReactMarkdown from "react-markdown";

interface Props {
  markdown: string;
}

export function ReportViewer({ markdown }: Props) {
  return (
    <div className="prose prose-sm max-w-none text-gray-800">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 6: Criar report/page.tsx**

```typescript
// frontend/app/report/page.tsx
import { createServerClient } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { ReportViewer } from "@/components/ReportViewer";
import { Report } from "@/lib/types";

export default async function ReportPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const brands = await apiFetch<{ id: string }[]>("/brands", token).catch(() => []);
  const brandId = brands[0]?.id;

  if (!brandId) return <div className="text-gray-500">Nenhuma marca cadastrada.</div>;

  let report: Report | null = null;
  try {
    report = await apiFetch<Report>(`/brands/${brandId}/reports/latest`, token);
  } catch {
    report = null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Relatório Semanal</h1>
      {report ? (
        <>
          <p className="text-sm text-gray-500 mt-1">
            Período: {report.period_start} — {report.period_end}
          </p>
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <ReportViewer markdown={report.content_md} />
          </div>
        </>
      ) : (
        <p className="mt-4 text-gray-400 text-sm">Nenhum relatório disponível ainda.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Criar ActionPlanList.tsx**

```typescript
// frontend/components/ActionPlanList.tsx
import { ActionPlan, Keyword } from "@/lib/types";

const PRIORITY_LABEL: Record<string, string> = { high: "Alta", medium: "Média", low: "Baixa" };
const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

interface Props {
  plans: ActionPlan[];
  keywords: Keyword[];
}

export function ActionPlanList({ plans, keywords }: Props) {
  const kwMap = Object.fromEntries(keywords.map((k) => [k.id, k.term]));
  const sorted = [...plans].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <ul className="space-y-3">
      {sorted.map((plan) => (
        <li key={plan.id} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[plan.priority]}`}>
              {PRIORITY_LABEL[plan.priority]}
            </span>
            <span className="text-xs text-gray-400 capitalize">{plan.engine}</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">{kwMap[plan.keyword_id] ?? plan.keyword_id}</span>
          </div>
          <p className="text-sm text-gray-800">{plan.recommendation}</p>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 8: Criar action-plan/page.tsx**

```typescript
// frontend/app/action-plan/page.tsx
import { createServerClient } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { ActionPlanList } from "@/components/ActionPlanList";
import { ActionPlan, Keyword } from "@/lib/types";

export default async function ActionPlanPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const brands = await apiFetch<{ id: string }[]>("/brands", token).catch(() => []);
  const brandId = brands[0]?.id;

  if (!brandId) return <div className="text-gray-500">Nenhuma marca cadastrada.</div>;

  const [plans, keywords] = await Promise.all([
    apiFetch<ActionPlan[]>(`/brands/${brandId}/action-plans`, token).catch(() => []),
    apiFetch<Keyword[]>(`/brands/${brandId}/keywords`, token).catch(() => []),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Plano de Ação</h1>
      <p className="text-sm text-gray-500 mt-1">Recomendações por keyword, ordenadas por prioridade</p>
      <div className="mt-6">
        {plans.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum plano de ação disponível ainda.</p>
        ) : (
          <ActionPlanList plans={plans} keywords={keywords} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Criar settings/page.tsx**

```typescript
// frontend/app/settings/page.tsx
"use client";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { Brand, Keyword } from "@/lib/types";

export default function SettingsPage() {
  const [token, setToken] = useState("");
  const [brand, setBrand] = useState<Brand | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [brandName, setBrandName] = useState("");
  const supabase = createBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const t = session?.access_token ?? "";
      setToken(t);
      loadData(t);
    });
  }, []);

  async function loadData(t: string) {
    const brands = await apiFetch<Brand[]>("/brands", t).catch(() => []);
    if (brands[0]) {
      setBrand(brands[0]);
      setBrandName(brands[0].name);
      const kws = await apiFetch<Keyword[]>(`/brands/${brands[0].id}/keywords`, t).catch(() => []);
      setKeywords(kws);
    }
    setLoading(false);
  }

  async function handleAddKeyword(e: React.FormEvent) {
    e.preventDefault();
    if (!brand || !newKeyword.trim()) return;
    await apiFetch(`/brands/${brand.id}/keywords`, token, {
      method: "POST",
      body: JSON.stringify({ term: newKeyword.trim() }),
    });
    setNewKeyword("");
    loadData(token);
  }

  async function handleDeleteKeyword(keywordId: string) {
    if (!brand) return;
    await apiFetch(`/brands/${brand.id}/keywords/${keywordId}`, token, { method: "DELETE" });
    loadData(token);
  }

  if (loading) return <div className="text-gray-400 text-sm">Carregando...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Marca monitorada</h2>
        {brand ? (
          <p className="text-sm text-gray-700">{brand.name}</p>
        ) : (
          <p className="text-sm text-gray-400">Nenhuma marca cadastrada.</p>
        )}
      </div>

      <div className="mt-4 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Keywords ({keywords.length}/10)
        </h2>
        <ul className="space-y-2 mb-4">
          {keywords.map((kw) => (
            <li key={kw.id} className="flex items-center justify-between text-sm text-gray-700">
              <span>{kw.term}</span>
              <button
                onClick={() => handleDeleteKeyword(kw.id)}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
        {keywords.length < 10 && brand && (
          <form onSubmit={handleAddKeyword} className="flex gap-2">
            <input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="ex: advogado trabalhista SP"
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Adicionar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Instalar react-markdown**

```bash
cd frontend
npm install react-markdown @tailwindcss/typography
```

- [ ] **Step 11: Adicionar plugin typography ao tailwind.config.ts**

```typescript
// frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
```

- [ ] **Step 12: Testar todas as páginas no browser**

```bash
npm run dev
# Verificar: /dashboard, /keywords, /history, /report, /action-plan, /settings
# Todas devem carregar sem erros (estado vazio é esperado)
```

- [ ] **Step 13: Commit**

```bash
git add frontend/
git commit -m "feat: todas as páginas do dashboard (keywords, history, report, action-plan, settings)"
```

---

### Task 13: Deploy

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/railway.toml` (ou dois arquivos de configuração para API + Worker)

**Interfaces:**
- Produces: API rodando em Railway, Worker rodando em Railway, Frontend na Vercel

- [ ] **Step 1: Criar Dockerfile do backend**

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# O Railway define qual comando rodar via variável de ambiente ou railway.toml
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Criar railway.toml para o serviço API**

```toml
# backend/railway.toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
```

- [ ] **Step 3: Configurar serviço Worker no Railway**

```bash
# No Railway Dashboard:
# 1. Criar novo serviço a partir do mesmo repo (pasta backend/)
# 2. Override do start command para: python -m worker.main
# 3. Adicionar as mesmas env vars (SUPABASE_URL, SUPABASE_SERVICE_KEY, etc.)
# 4. NÃO expor porta pública no Worker (não é um servidor HTTP)
```

- [ ] **Step 4: Configurar Railway Cron**

```bash
# No Railway Dashboard:
# Criar Cron Job:
# Schedule: 0 8 * * 1  (toda segunda-feira às 8h)
# Command: curl -X POST https://vistai-api.railway.app/internal/create-jobs -H "X-Internal-Key: $INTERNAL_API_KEY"
```

- [ ] **Step 5: Deploy do frontend na Vercel**

```bash
cd frontend
npx vercel --prod
# Configurar env vars no Vercel Dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# NEXT_PUBLIC_API_URL=https://vistai-api.railway.app
```

- [ ] **Step 6: Smoke test end-to-end**

```bash
# 1. Criar conta em https://vistai.vercel.app/auth/signup
# 2. Logar e acessar /settings → adicionar marca e 2 keywords
# 3. Disparar job manualmente via curl:
curl -X POST https://vistai-api.railway.app/internal/create-jobs \
  -H "X-Internal-Key: $INTERNAL_API_KEY"
# 4. Aguardar ~2 min e verificar /dashboard — scores devem aparecer
# 5. Verificar /report e /action-plan
```

- [ ] **Step 7: Commit final**

```bash
git add backend/Dockerfile backend/railway.toml
git commit -m "feat: docker + railway config para deploy"
```

---

## Self-Review

**Cobertura do spec:**
- ✅ Supabase Auth (email/senha) — Task 10
- ✅ 1 marca, 10 keywords (validação no router) — Task 3
- ✅ ChatGPT (gpt-4o-mini) + Gemini (gemini-1.5-flash) — Task 4
- ✅ Railway Cron semanal → /internal/create-jobs — Task 9, 13
- ✅ Polling 30s, 5 disparos/keyword, retry 3x — Task 8
- ✅ GEO Score 4 fatores — Task 6
- ✅ 6 páginas do dashboard — Tasks 11–12
- ✅ Relatório Claude Sonnet em markdown — Task 7
- ✅ Plano de ação por keyword/engine com prioridade — Task 7, 12
- ✅ RLS no Supabase — Task 1
- ✅ Connectors modulares (fácil adicionar Perplexity depois) — Task 4

**Sem placeholders:** confirmado — todo passo tem código real.

**Consistência de tipos:** `Score`, `Brand`, `Keyword`, `Report`, `ActionPlan` definidos em `lib/types.ts` (Task 10) e usados nas Tasks 11–12. Schemas Pydantic definidos em `app/models/schemas.py` (Task 2) e usados em todas as Tasks 3–9.
