# Nunito + Sessão 30min + Hardening Essencial — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a fonte do corpo por Nunito, deslogar usuários após 30 min de inatividade (server + client) e aplicar hardening essencial (headers, rate limit de scan, audits).

**Architecture:** Frontend Next.js 14 App Router (`velo/frontend`) com Supabase SSR; o corpo do texto é controlado pela var CSS `--font-mono` mapeada no Tailwind. Backend FastAPI (`velo/backend`) com auth Bearer via Supabase. Sessão por inatividade: cookie de última atividade verificado no middleware (enforcement) + timer no cliente (UX). Rate limit reutiliza a tabela `public_checks` existente.

**Tech Stack:** Next.js 14, Tailwind 3, @supabase/ssr, FastAPI, pytest (httpx AsyncClient), Supabase.

**Spec:** `docs/superpowers/specs/2026-07-09-nunito-sessao-seguranca-design.md`

**Nota Windows:** shell é bash; sempre citar caminhos com aspas. Raiz do repo: `C:\Users\joaov\OneDrive\Área de Trabalho\FUTURO`.

---

### Task 1: Fonte Nunito no corpo do texto

O corpo inteiro (app + landing) usa a classe Tailwind `font-mono` → `var(--font-mono)` → IBM Plex Mono, e a landing remapeia `--font-mono` para Inter inline. Estratégia: renomear a família para `font-body` apontando para Nunito; `font-mono` passa a usar stack monospace do sistema (fica disponível para usos pontuais, sem carregar IBM Plex). Inter é removida.

**Files:**
- Modify: `velo/frontend/app/layout.tsx`
- Modify: `velo/frontend/tailwind.config.ts`
- Modify: `velo/frontend/app/page.tsx:618-629` (remap da landing)
- Modify (rename mecânico `font-mono` → `font-body`): todos os `.tsx` em `velo/frontend/app`, `velo/frontend/components`, `velo/frontend/lib`

- [ ] **Step 1: Trocar imports de fonte no root layout**

Em `velo/frontend/app/layout.tsx`, substituir o bloco de imports/definições de fontes (linhas 1–29) por:

```tsx
import type { Metadata } from "next";
import { Fraunces, Manrope, Nunito } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/lib/toast";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "700", "900"],
});

// Títulos da landing (estilo Semrush)
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "700", "800"],
});

// Fonte do corpo do texto em todo o produto
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});
```

E o `<body>` (linha 40) passa de:

```tsx
<body className={`${fraunces.variable} ${ibmPlexMono.variable} ${manrope.variable} ${inter.variable} font-mono bg-bone text-ink`}>
```

para:

```tsx
<body className={`${fraunces.variable} ${manrope.variable} ${nunito.variable} font-body bg-bone text-ink`}>
```

- [ ] **Step 2: Atualizar o Tailwind config**

Em `velo/frontend/tailwind.config.ts`, substituir o bloco `fontFamily` (linhas 26–29) por:

```ts
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body:    ["var(--font-body)", "sans-serif"],
        mono:    ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
```

- [ ] **Step 3: Remover o remap de fonte da landing**

Em `velo/frontend/app/page.tsx` (linhas ~618–629), o `<main>` da landing remapeia as vars. Substituir:

```tsx
    <main
      className="bg-bone text-ink antialiased"
      // Tipografia da landing (estilo Semrush): títulos em Manrope, corpo em Inter.
      // Sobrescreve as vars localmente — o resto do app segue Fraunces + IBM Plex Mono.
      style={
        {
          "--font-fraunces": "var(--font-manrope)",
          "--font-mono": "var(--font-inter)",
        } as React.CSSProperties
      }
    >
```

por:

```tsx
    <main
      className="bg-bone text-ink antialiased"
      // Tipografia da landing: títulos em Manrope; corpo segue a Nunito global.
      style={
        {
          "--font-fraunces": "var(--font-manrope)",
        } as React.CSSProperties
      }
    >
```

- [ ] **Step 4: Rename mecânico `font-mono` → `font-body`**

Rodar (a partir da raiz do repo):

```bash
cd "velo/frontend" && grep -rl 'font-mono' app components lib --include='*.tsx' | xargs sed -i 's/font-mono/font-body/g'
```

Atenção: rodar este passo DEPOIS dos steps 1–3 (que já removeram as ocorrências de `--font-mono` em strings de variável). Este sed deve tocar apenas classes CSS.

- [ ] **Step 5: Verificar que não sobrou `font-mono` nem Inter/IBM Plex**

```bash
cd "velo/frontend" && grep -rn 'font-mono\|--font-inter\|IBM_Plex_Mono\|Inter' app components lib --include='*.tsx' | grep -v 'font-body'
```

Expected: nenhuma linha (exit code 1). Se aparecer algo, corrigir manualmente.

- [ ] **Step 6: Build para validar**

```bash
cd "velo/frontend" && npm run build
```

Expected: build conclui sem erros de tipo/compilação.

- [ ] **Step 7: Verificação visual rápida**

```bash
cd "velo/frontend" && npm run dev
```

Abrir `http://localhost:3000` (landing) e `/dashboard` (app): corpo do texto e menus em Nunito (arredondada); títulos ainda Fraunces/Manrope. Parar o dev server depois.

- [ ] **Step 8: Commit**

```bash
git add velo/frontend/app velo/frontend/components velo/frontend/lib velo/frontend/tailwind.config.ts
git commit -m "feat: Nunito como fonte do corpo em todo o produto"
```

---

### Task 2: Logout por inatividade — enforcement no middleware

**Files:**
- Modify: `velo/frontend/middleware.ts`

- [ ] **Step 1: Adicionar verificação de inatividade no middleware**

Substituir o conteúdo de `velo/frontend/middleware.ts` por:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const IDLE_LIMIT_MS = 30 * 60 * 1000; // 30 minutos de inatividade
const ACTIVITY_COOKIE = "velo_last_activity";

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

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/auth");
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/legal") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (user) {
    const last = Number(request.cookies.get(ACTIVITY_COOKIE)?.value ?? 0);
    const now = Date.now();

    if (last > 0 && now - last > IDLE_LIMIT_MS) {
      // Sessão expirada por inatividade: desloga e redireciona
      await supabase.auth.signOut();
      const redirect = NextResponse.redirect(
        new URL("/auth/login?reason=inactivity", request.url)
      );
      // Propaga os cookies de limpeza de sessão gerados pelo signOut
      supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c));
      redirect.cookies.set(ACTIVITY_COOKIE, "", { maxAge: 0, path: "/" });
      return redirect;
    }

    supabaseResponse.cookies.set(ACTIVITY_COOKIE, String(now), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }

  // Unauthenticated user trying to access protected route → login
  if (!user && !isAuthPage && !isPublic) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Authenticated user on auth page → dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
```

- [ ] **Step 2: Build para validar**

```bash
cd "velo/frontend" && npm run build
```

Expected: sem erros.

- [ ] **Step 3: Teste manual com tempo reduzido**

Temporariamente mudar `IDLE_LIMIT_MS` para `60 * 1000` (1 min), rodar `npm run dev`, logar, esperar 1 min sem interagir e navegar: deve redirecionar para `/auth/login?reason=inactivity`. Reverter para `30 * 60 * 1000` depois do teste.

- [ ] **Step 4: Commit**

```bash
git add velo/frontend/middleware.ts
git commit -m "feat: logout automático após 30min de inatividade (middleware)"
```

---

### Task 3: Logout por inatividade — timer no cliente com aviso

**Files:**
- Create: `velo/frontend/components/IdleLogout.tsx`
- Modify: `velo/frontend/app/(app)/layout.tsx`
- Modify: `velo/frontend/app/auth/login/page.tsx`

- [ ] **Step 1: Criar o componente IdleLogout**

Criar `velo/frontend/components/IdleLogout.tsx`:

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const IDLE_LIMIT_MS = 30 * 60 * 1000; // desloga aos 30 min
const WARNING_MS = 28 * 60 * 1000; // avisa aos 28 min
const CHECK_INTERVAL_MS = 10_000;

export default function IdleLogout() {
  const [showWarning, setShowWarning] = useState(false);
  const lastActivity = useRef(Date.now());
  const router = useRouter();

  useEffect(() => {
    const markActivity = () => {
      lastActivity.current = Date.now();
      setShowWarning(false);
    };
    const events = ["mousedown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) =>
      window.addEventListener(e, markActivity, { passive: true })
    );

    const interval = setInterval(async () => {
      const idle = Date.now() - lastActivity.current;
      if (idle >= IDLE_LIMIT_MS) {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/auth/login?reason=inactivity");
      } else if (idle >= WARNING_MS) {
        setShowWarning(true);
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach((e) => window.removeEventListener(e, markActivity));
      clearInterval(interval);
    };
  }, [router]);

  if (!showWarning) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white rounded-2xl px-5 py-4 shadow-xl max-w-xs">
      <p className="font-body text-sm font-semibold mb-1">Você ainda está aí?</p>
      <p className="font-body text-xs text-slate-300 mb-3">
        Por segurança, você será desconectado por inatividade em até 2 minutos.
      </p>
      <button
        onClick={() => {
          lastActivity.current = Date.now();
          setShowWarning(false);
        }}
        className="bg-moss-600 hover:bg-moss-700 text-white font-body text-xs font-semibold px-4 py-2 rounded-full transition-colors"
      >
        Continuar conectado
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Montar no layout autenticado**

Em `velo/frontend/app/(app)/layout.tsx`, adicionar o import:

```tsx
import IdleLogout from "@/components/IdleLogout";
```

e dentro do JSX raiz (`<div className="flex min-h-screen bg-zinc-50">`), logo antes do `<aside`, adicionar:

```tsx
      <IdleLogout />
```

- [ ] **Step 3: Mensagem de inatividade na página de login**

Em `velo/frontend/app/auth/login/page.tsx`:

Adicionar `useEffect` ao import de react (linha 3):

```tsx
import { useEffect, useState } from "react";
```

Adicionar estado + efeito dentro do componente (após os `useState` existentes):

```tsx
  const [inactiveLogout, setInactiveLogout] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInactiveLogout(params.get("reason") === "inactivity");
  }, []);
```

E no JSX, logo acima do `<form`, adicionar:

```tsx
          {inactiveLogout && (
            <p className="font-body text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mb-4">
              Você foi desconectado por inatividade. Entre novamente para continuar.
            </p>
          )}
```

Nota: se a Task 1 já rodou, as classes do arquivo estarão como `font-body`; caso contrário usar `font-mono`. Manter consistente com o restante do arquivo.

- [ ] **Step 4: Build para validar**

```bash
cd "velo/frontend" && npm run build
```

Expected: sem erros.

- [ ] **Step 5: Teste manual com tempo reduzido**

Reduzir `WARNING_MS` para `20_000` e `IDLE_LIMIT_MS` para `40_000` em `IdleLogout.tsx`, rodar dev, logar e ficar parado: aviso aparece aos ~20s, logout aos ~40s com mensagem no login. Reverter os valores.

- [ ] **Step 6: Commit**

```bash
git add velo/frontend/components/IdleLogout.tsx "velo/frontend/app/(app)/layout.tsx" velo/frontend/app/auth/login/page.tsx
git commit -m "feat: aviso e logout no cliente após inatividade"
```

---

### Task 4: Security headers no Next.js

**Files:**
- Modify: `velo/frontend/next.config.mjs`

- [ ] **Step 1: Adicionar headers globais**

Substituir o conteúdo de `velo/frontend/next.config.mjs` por:

```js
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
```

Nota: `'unsafe-inline'/'unsafe-eval'` em script-src são necessários para Next.js sem nonces; CSP estrita com nonces está fora de escopo ("essencial").

- [ ] **Step 2: Validar headers e app funcionando**

```bash
cd "velo/frontend" && npm run build && (npm run start &) && sleep 5 && curl -sI http://localhost:3000 | grep -i 'x-frame\|content-security\|strict-transport'
```

Expected: os três headers presentes. Depois abrir `http://localhost:3000` e o `/dashboard` e conferir no console do navegador que não há erros de CSP bloqueando recursos (Supabase, Recharts, fontes). Encerrar o server (`npx kill-port 3000` ou fechar o processo).

- [ ] **Step 3: Commit**

```bash
git add velo/frontend/next.config.mjs
git commit -m "feat: security headers (CSP, HSTS, X-Frame-Options) no frontend"
```

---

### Task 5: Rate limit diário no force scan (backend, TDD)

O `ai_check` autenticado já tem limite (20/dia por marca). Falta limitar o `POST /brands/{id}/scan` (dispara scans que consomem APIs de IA). Reutilizar o padrão da tabela `public_checks` com chave `scan:{brand_id}`, limite 5/dia, extraído para helper.

**Files:**
- Create: `velo/backend/app/rate_limit.py`
- Modify: `velo/backend/app/routers/brands.py`
- Test: `velo/backend/tests/test_routers_brands.py`

- [ ] **Step 1: Escrever o teste que falha**

Adicionar ao final de `velo/backend/tests/test_routers_brands.py`:

```python
def _force_scan_tables(scan_count: int, active_jobs: list):
    """Mocks para as tabelas jobs e public_checks usadas pelo force_scan."""
    jobs_tbl = MagicMock()
    jobs_tbl.select.return_value.eq.return_value.in_.return_value.execute.return_value.data = active_jobs
    jobs_tbl.insert.return_value.execute.return_value.data = [{"id": str(uuid4()), "status": "pending"}]

    checks_tbl = MagicMock()
    existing = [{"ip_hash": "k", "date": "2026-07-09", "count": scan_count}] if scan_count else []
    checks_tbl.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = existing
    checks_tbl.upsert.return_value.execute.return_value = MagicMock()

    return {"jobs": jobs_tbl, "public_checks": checks_tbl}


@pytest.mark.asyncio
async def test_force_scan_daily_limit(client):
    from app.main import app

    async def override_get_current_user():
        return MOCK_USER

    app.dependency_overrides[get_current_user] = override_get_current_user
    tables = _force_scan_tables(scan_count=5, active_jobs=[])

    with patch("app.routers.brands.require_brand_access", new=AsyncMock(return_value=ORG_ID)), \
         patch("app.routers.brands.supabase_client") as mock_db, \
         patch("app.rate_limit.supabase_client") as mock_rl_db:
        mock_db.return_value.table.side_effect = lambda name: tables[name]
        mock_rl_db.return_value.table.side_effect = lambda name: tables[name]
        response = await client.post(f"/brands/{BRAND_ID}/scan", headers=AUTH_HEADERS)

    app.dependency_overrides.clear()
    assert response.status_code == 429


@pytest.mark.asyncio
async def test_force_scan_under_limit(client):
    from app.main import app

    async def override_get_current_user():
        return MOCK_USER

    app.dependency_overrides[get_current_user] = override_get_current_user
    tables = _force_scan_tables(scan_count=0, active_jobs=[])

    with patch("app.routers.brands.require_brand_access", new=AsyncMock(return_value=ORG_ID)), \
         patch("app.routers.brands.supabase_client") as mock_db, \
         patch("app.rate_limit.supabase_client") as mock_rl_db:
        mock_db.return_value.table.side_effect = lambda name: tables[name]
        mock_rl_db.return_value.table.side_effect = lambda name: tables[name]
        response = await client.post(f"/brands/{BRAND_ID}/scan", headers=AUTH_HEADERS)

    app.dependency_overrides.clear()
    assert response.status_code == 202
```

- [ ] **Step 2: Rodar os testes para vê-los falhar**

```bash
cd "velo/backend" && python -m pytest tests/test_routers_brands.py -v -k force_scan
```

Expected: FAIL — `test_force_scan_daily_limit` recebe 202 em vez de 429 (limite ainda não existe) e/ou erro de import de `app.rate_limit`.

- [ ] **Step 3: Criar o helper de rate limit**

Criar `velo/backend/app/rate_limit.py`:

```python
"""Rate limit diário reutilizando a tabela public_checks (chave arbitrária + data)."""

import asyncio
from datetime import datetime, timezone

from fastapi import HTTPException

from app.database import supabase_client


async def enforce_daily_limit(key: str, limit: int, detail: str) -> None:
    """Levanta 429 se `key` já atingiu `limit` usos hoje; senão incrementa."""
    db = supabase_client()
    today = str(datetime.now(timezone.utc).date())

    existing = (await asyncio.to_thread(
        lambda: db.table("public_checks").select("*")
        .eq("ip_hash", key).eq("date", today).execute()
    )).data or []
    current = existing[0]["count"] if existing else 0
    if current >= limit:
        raise HTTPException(status_code=429, detail=detail)

    await asyncio.to_thread(
        lambda: db.table("public_checks").upsert({
            "ip_hash": key,
            "date": today,
            "count": current + 1,
        }, on_conflict="ip_hash,date").execute()
    )
```

- [ ] **Step 4: Aplicar o limite no force_scan**

Em `velo/backend/app/routers/brands.py`:

Adicionar aos imports (topo do arquivo):

```python
import hashlib

from app.rate_limit import enforce_daily_limit
```

Adicionar a constante após `router = APIRouter(...)`:

```python
DAILY_SCAN_LIMIT = 5
```

No `force_scan`, logo após `await require_brand_access(brand_id, user)`, adicionar:

```python
    await enforce_daily_limit(
        key=hashlib.sha256(f"scan:{brand_id}".encode()).hexdigest(),
        limit=DAILY_SCAN_LIMIT,
        detail="Limite diário de scans manuais atingido. O scan automático semanal continua normalmente.",
    )
```

- [ ] **Step 5: Rodar os testes do force_scan**

```bash
cd "velo/backend" && python -m pytest tests/test_routers_brands.py -v -k force_scan
```

Expected: 2 passed.

- [ ] **Step 6: Rodar a suíte inteira do backend**

```bash
cd "velo/backend" && python -m pytest -v
```

Expected: todos passam (sem regressão).

- [ ] **Step 7: Commit**

```bash
git add velo/backend/app/rate_limit.py velo/backend/app/routers/brands.py velo/backend/tests/test_routers_brands.py
git commit -m "feat: rate limit diário (5/dia) no scan manual por marca"
```

---

### Task 6: Audit de dependências e varredura de segredos

Somente vulnerabilidades **críticas/altas** com fix disponível. Não atualizar major versions sem necessidade.

**Files:**
- Modify (possivelmente): `velo/frontend/package.json`, `velo/frontend/package-lock.json`, `velo/backend/requirements.txt`

- [ ] **Step 1: Audit do frontend**

```bash
cd "velo/frontend" && npm audit --audit-level=high
```

Se houver críticas/altas com fix não-breaking: `npm audit fix` (NUNCA `npm audit fix --force`). Depois `npm run build` para confirmar que nada quebrou. Se o fix exigir major bump, apenas reportar ao usuário — não aplicar.

- [ ] **Step 2: Audit do backend**

```bash
cd "velo/backend" && pip install pip-audit -q && pip-audit -r requirements.txt
```

Para vulnerabilidades críticas/altas com fix: atualizar a versão pinada em `requirements.txt` e rodar `python -m pytest -v` para confirmar. Se exigir mudança breaking, apenas reportar.

- [ ] **Step 3: Varredura de segredos no repositório**

```bash
cd "../.." 2>/dev/null; grep -rn --include='*.ts' --include='*.tsx' --include='*.py' --include='*.mjs' --include='*.toml' --include='*.json' -iE '(sk-[a-zA-Z0-9]{20,}|api[_-]?key\s*[:=]\s*["'"'"'][A-Za-z0-9_\-]{16,}|service_role)' velo docs supabase | grep -v node_modules | grep -v 'NEXT_PUBLIC\|settings\.\|env\|process\.'
```

Expected: nenhuma linha com segredo real hardcoded. Chaves via `process.env`/`settings.` são OK. Se encontrar segredo real: reportar ao usuário imediatamente (rotação necessária) — não commitar remoção sem alinhamento.

- [ ] **Step 4: Commit (se houve mudanças)**

```bash
git add velo/frontend/package.json velo/frontend/package-lock.json velo/backend/requirements.txt
git commit -m "fix: atualiza dependências com vulnerabilidades críticas/altas"
```

Se nada mudou, pular o commit.

---

### Task 7: Verificação final integrada

- [ ] **Step 1: Build do frontend e suíte do backend**

```bash
cd "velo/frontend" && npm run build && cd "../backend" && python -m pytest -v
```

Expected: build OK, todos os testes passam.

- [ ] **Step 2: Checklist manual (dev server)**

- Landing e app com corpo em Nunito, títulos inalterados, sem erro de CSP no console
- Login → dashboard funciona; logout manual funciona
- `curl -sI http://localhost:3000 | grep -i content-security` mostra a CSP
- Cookie `velo_last_activity` presente após login (DevTools → Application → Cookies)
