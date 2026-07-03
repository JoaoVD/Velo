# Velo — Retenção inspirada na Semrush

**Data:** 2026-07-03
**Status:** Aprovado (ordem B → A → C, autorizada pelo usuário)

---

## Contexto

Análise da landing/produto da Semrush identificou 4 mecânicas de retenção aplicáveis ao Velo: alertas de mudança, benchmarking de concorrentes (share of voice), score com tendência temporal e ferramenta gratuita de aquisição. O usuário aprovou implementar B (alertas), A (share of voice) e C (checker grátis), nessa ordem, além de aproximar a tipografia da landing à da Semrush.

Estado atual relevante:

- Worker (`backend/worker/processor.py`) já envia e-mail semanal, mas com `score_change=0` fixo e sem alertas.
- CRUD de concorrentes já existe (`backend/app/routers/competitors.py`, tabela `competitors`, UI em settings, limite de 3), mas o scan não mede menções de concorrentes.
- Analyzer (`backend/app/analysis/analyzer.py`) faz 1 chamada Claude por resposta, retornando `{mentioned, position, sentiment}` só da marca.

---

## B — Alertas de mudança + digest com variação real

**Variação real no e-mail semanal:** antes de enviar, o worker calcula o score médio geral do scan anterior (média de `scores.geo_score` da data de scan anterior mais recente, por brand) e passa `score_change` real para `send_weekly_report_email`.

**Alertas:** após calcular os scores do scan atual, o worker compara com o scan anterior e dispara `send_alert_email` (novo template em `app/email/sender.py`) quando:

- Queda do score médio geral ≥ 10 pontos; ou
- Alguma keyword que tinha `mention_score = 100` (era mencionada) passou a `mention_score = 0` em algum engine.

O e-mail de alerta lista as keywords afetadas e linka para o dashboard. Erros de e-mail nunca falham o job (mesmo padrão atual). Sem scan anterior → sem alerta, `score_change = 0`.

## A — Share of voice de concorrentes

**Análise:** `ANALYSIS_PROMPT` passa a receber também a lista de nomes de concorrentes e retorna, na mesma chamada Claude (custo marginal ~zero), `competitors: {nome: {mentioned, position}}`.

**Persistência:** nova tabela `competitor_scores`:

```sql
competitor_scores (
  id uuid pk,
  competitor_id uuid fk competitors on delete cascade,
  keyword_id uuid fk keywords on delete cascade,
  engine text check (chatgpt|gemini),
  date date,
  frequency_score numeric(5,2),  -- % de respostas que mencionam o concorrente
  position_score numeric(5,2),
  unique(competitor_id, keyword_id, engine, date)
)
```

RLS select para membros da org (mesmo padrão de `scores`).

**API:** `GET /brands/{brand_id}/share-of-voice` — retorna, por keyword e engine, o frequency_score da marca e de cada concorrente na data mais recente (e série histórica por data para tendência).

**UI:** seção "Share of Voice" no dashboard: barra comparativa marca vs. concorrentes por keyword, com destaque quando um concorrente ultrapassa a marca.

## C — Checker gratuito na landing

**API:** `POST /public/ai-check` (sem auth): body `{brand_name, keyword}`. Executa 1 consulta ao ChatGPT (gpt-4o-mini) com o mesmo `build_consumer_prompt` + 1 análise Claude, retorna `{mentioned, position, sentiment, snippet}` (snippet = trecho de até 300 chars da resposta). Rate limit: 3 verificações por IP por dia (tabela `public_checks` com IP hasheado + contagem, ou contador em memória — decidir na implementação pela opção persistente, pois o Railway pode reiniciar).

**UI:** seção na landing "Veja grátis como o ChatGPT descreve sua marca" com formulário (marca + termo de busca), resultado inline com o veredito e CTA "Monitore isso toda semana → criar conta grátis".

## Tipografia da landing (estilo Semrush)

A Semrush usa Inter (corpo/UI) e Factor A (títulos, proprietária). Aproximação gratuita: **Manrope** (títulos) + **Inter** (corpo). Escopo: **somente a landing** (`app/page.tsx`) e páginas legais permanecem como estão.

Implementação: carregar Manrope e Inter via `next/font` no root layout (vars `--font-manrope`, `--font-inter`); no `<main>` da landing, sobrescrever localmente `--font-fraunces → var(--font-manrope)` e `--font-mono → var(--font-inter)`, trocando toda a tipografia da página sem tocar no resto do app. PRODUCT.md atualizado com a exceção da landing.

## Fora de escopo

- Gamificação, Academy/certificações, alertas in-app, digest configurável.
- Checker no Gemini (só ChatGPT no MVP do checker).

## Testes

- Unit: cálculo de variação e condição de alerta (função pura extraída do worker); analyzer parsing com concorrentes; rate limit do checker.
- Verificação: `pytest` no backend, `tsc --noEmit` + `next lint` no frontend.
