# Design: Fonte Nunito no corpo, sessão de 30 min por inatividade e hardening essencial

**Data:** 2026-07-09
**Escopo:** `velo/frontend` (Next.js 14 + Supabase SSR) e `velo/backend` (FastAPI)

## Objetivos

1. Trocar a fonte do corpo do texto por **Nunito** (arredondada, "cheinha", sem parecer negrito).
2. Deslogar automaticamente o usuário após **30 minutos de inatividade**.
3. Corrigir apenas riscos de segurança **críticos/altos** (escopo "essencial").
4. Extras aprovados: rate limit nos endpoints autenticados que disparam IA e aviso visual antes do logout.

## 1. Fonte Nunito (corpo do texto)

- Adicionar `Nunito` via `next/font/google` em `velo/frontend/app/layout.tsx` (pesos 400, 500, 600, 700), variável `--font-nunito`.
- Aplicar Nunito como fonte de corpo em todo o produto:
  - `<body>` troca `font-mono` (IBM Plex Mono) por Nunito.
  - Landing: textos de corpo que hoje usam Inter passam a usar Nunito.
- **Títulos não mudam:** Fraunces (app) e Manrope (landing) permanecem.
- Registrar Nunito no `tailwind.config.ts` (ex.: `font-sans` → Nunito). IBM Plex Mono continua disponível como `font-mono` para usos pontuais (números, código), mas deixa de ser o padrão do corpo.
- Remover a fonte Inter se não sobrar nenhum uso.

## 2. Sessão: logout após 30 min de inatividade

**Abordagem escolhida: enforcement no middleware (server-side) + timer no cliente (UX).**

### Server-side (`velo/frontend/middleware.ts`)
- Cookie `velo_last_activity` (timestamp), atualizado a cada request de usuário autenticado.
- Se o cookie existir e a diferença for > 30 min: chamar `supabase.auth.signOut()`, limpar cookies de sessão e redirecionar para `/auth/login?reason=inactivity`.
- Se o cookie não existir para usuário autenticado, criá-lo (primeiro request após login).
- Cookie com `httpOnly`, `secure` (em produção), `sameSite=lax`.

### Client-side (componente no layout autenticado `app/(app)/layout.tsx`)
- Hook/componente `IdleLogout` que monitora atividade (mouse, teclado, scroll, touch) com debounce.
- Aos **28 minutos** de inatividade: exibir aviso visual ("Você será desconectado por inatividade em 2 minutos") com botão para continuar conectado.
- Aos **30 minutos**: `supabase.auth.signOut()` + redirect para `/auth/login?reason=inactivity`.
- A página de login exibe mensagem amigável quando `reason=inactivity`.

## 3. Segurança essencial

Estado atual verificado: endpoints internos protegidos por `X-Internal-Key`; checker público com rate limit por IP (hash com salt, LGPD); acesso a marcas validado por organização. Lacunas essenciais:

### 3.1 Security headers (frontend)
`next.config.mjs` está vazio. Adicionar headers globais:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `Permissions-Policy` restritiva (camera, microphone, geolocation desativados)
- `Content-Security-Policy` básica compatível com Next.js, Supabase e Recharts (sem quebrar o app; validar em dev antes).

### 3.2 Rate limit em endpoints autenticados de IA (backend)
- Identificar endpoints autenticados que disparam chamadas a modelos de IA (ex.: `ai_check`, force scan) e aplicar rate limit por usuário/organização, reutilizando o padrão já existente no checker público.
- Limites simples (ex.: N chamadas por hora por organização) — objetivo é conter abuso de custo, não sofisticação.

### 3.3 Verificações pontuais
- `npm audit` (frontend) e `pip-audit`/`pip list --outdated` (backend): corrigir apenas vulnerabilidades **críticas/altas** com fix disponível que não quebre compatibilidade.
- Varredura rápida de segredos expostos no repositório e no bundle do frontend (chaves além das `NEXT_PUBLIC_*` esperadas).

**Fora de escopo (decisão do usuário):** melhorias de baixo impacto, refatorações de segurança amplas, CSP estrita com nonces, WAF/infra.

## Critérios de sucesso

- Corpo do texto em Nunito em toda a aplicação; títulos inalterados; sem FOUT perceptível (next/font).
- Usuário inativo por 30 min é redirecionado ao login em qualquer request seguinte (server) e na própria aba aberta (client), com aviso aos 28 min.
- Headers de segurança presentes nas respostas do frontend (verificável via curl/devtools) sem quebrar nenhuma página.
- Endpoints de IA autenticados retornam 429 ao exceder o limite.
- `npm audit`/`pip-audit` sem vulnerabilidades críticas/altas corrigíveis pendentes.

## Testes

- Manual: navegação completa (landing + app) verificando fonte e ausência de quebras de CSP no console.
- Sessão: simular inatividade com tempo reduzido (env/constante) para validar aviso, logout client-side e enforcement no middleware.
- Backend: testes de rate limit nos endpoints de IA (pytest, seguindo padrão existente em `velo/backend/tests`).
