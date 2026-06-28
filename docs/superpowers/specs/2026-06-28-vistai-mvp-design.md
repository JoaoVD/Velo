# Velo MVP — Design Spec

**Data:** 2026-06-28
**Status:** Aprovado

---

## Problema

As IAs generativas (ChatGPT, Perplexity, Gemini, Claude) estão se tornando o novo ponto de entrada para decisões de compra e contratação. Quando alguém pergunta "qual advogado trabalhista em SP você recomenda?" ou "melhor clínica odontológica em Campinas", as LLMs respondem com nomes específicos — e a maioria das empresas brasileiras não sabe se aparece, como aparece, ou se está sendo preterida por concorrentes. Não existe hoje, no Brasil, uma ferramenta acessível que monitore isso de forma contínua e em português.

---

## Solução

SaaS B2B que monitora automaticamente como as principais IAs generativas descrevem, citam e recomendam uma marca — e gera um plano de ação por keyword para melhorar essa presença (GEO: Generative Engine Optimization).

---

## Públicos-alvo

**PMEs de serviços regulados** — escritórios de advocacia (OAB limita propaganda), clínicas de saúde (CFM, CRP), consultórios. Aparecer organicamente nas IAs é um dos poucos canais de captação disponíveis. A dor é clara e o ticket para resolver é alto.

**Agências de marketing digital** — canal de revenda. A agência assina o plano Agency, repassa o serviço com margem para seus clientes e usa o relatório white-label para justificar o fee mensal.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui |
| Backend | FastAPI (Railway) |
| Worker | FastAPI (Railway — serviço separado) |
| Banco de dados | Supabase (PostgreSQL + Auth + RLS) |
| Scheduler | Railway Cron |
| Análise de IA | Claude Sonnet 4.5 (scoring) + Claude Sonnet (relatório/plano de ação) |
| LLMs monitoradas | ChatGPT (gpt-4o-mini) + Gemini (gemini-1.5-flash) |
| E-mail | Resend |
| Monitoramento | Sentry + PostHog |
| Deploy | Vercel (frontend) + Railway (backend) |

**Custo de IA por cliente:** ~US$5/mês usando Claude Sonnet + prompt caching + Batch API. Margem saudável mesmo no tier Starter (R$149/mês).

---

## Design System

### Paleta de cores

```css
--color-ink:     #0f1923   /* textos, fundo escuro */
--color-navy:    #1a3a5c   /* elementos secundários */
--color-signal:  #c8460a   /* acento principal, CTAs */
--color-ice:     #e8f0f7   /* fundo de cards de dados */
--color-bone:    #f5f2eb   /* fundo claro principal */
--color-confirm: #2d6a4f   /* scores altos, métricas positivas */
```

### Tipografia

- **Display / Headlines:** Fraunces (Google Fonts, weights 300/700/900) — titles, scores grandes
- **UI / Dados / Código:** IBM Plex Mono (Google Fonts, weights 300/400/500/600) — labels, corpo, metadados
- Nunca usar Inter, Roboto, Arial, Space Grotesk
- Nunca usar gradientes purple/azul

### Regras de aplicação

- Fundo padrão: `--color-bone`
- Cards de dados: `--color-ice` como fundo
- CTA e acento: `--color-signal`
- Scores e métricas grandes: Fraunces 900
- Scores positivos / em alta: `--color-confirm`
- UI library: shadcn/ui + Tailwind

---

## Arquitetura Geral

```
[Vercel]                [Railway - API]       [Railway - Worker]     [Supabase]
Next.js Dashboard  -->  FastAPI API Server <-> FastAPI Worker    <-> PostgreSQL + Auth

[Railway Cron] --> POST /internal/create-jobs (semanal)
```

**Fluxo em uma linha:** Cron cria jobs no Supabase → Worker pega jobs → chama ChatGPT/Gemini → Claude Sonnet analisa → score calculado → relatório gerado → cliente vê no dashboard.

---

## Modelo de Dados

```
organizations
  id, name, plan (starter/pro/agency), created_at

brands
  id, organization_id, name, website, created_at

keywords
  id, brand_id, term ("advogado trabalhista SP"), created_at

jobs
  id, brand_id, status (pending/running/done/failed),
  scheduled_for, started_at, completed_at, error_message

query_results
  id, job_id, keyword_id, engine (chatgpt/gemini),
  raw_response, prompt_used, created_at

scores
  id, keyword_id, engine, date,
  mention_score, position_score, sentiment_score, frequency_score,
  geo_score (final ponderado)

reports
  id, brand_id, period_start, period_end,
  content_md, pdf_url, created_at

action_plans
  id, keyword_id, engine,
  recommendation (text), priority (high/med/low), created_at
```

**Decisões de design:**
- `query_results` guarda o prompt exato usado — rastreabilidade e re-análise futura
- `scores` é calculado e persistido (não on-the-fly) — dashboard rápido mesmo com histórico longo
- `action_plans` por keyword+engine — permite recomendações específicas por contexto

---

## GEO Score

Score calculado por keyword por engine, escala 0–100.

| Fator | Peso | O que mede |
|---|---|---|
| Menção | 30% | A marca foi citada na resposta? |
| Posição | 25% | 1ª recomendação = 100, 2ª = 70, 3ª+ = 40, não citado = 0 |
| Sentimento | 25% | Positivo / neutro / negativo (analisado pelo Claude Sonnet) |
| Frequência | 20% | % de disparos da keyword onde a marca aparece |

**Score final:** média ponderada por keyword, depois agregado por engine.

**Exemplo:** Para "advogado trabalhista SP" com 10 disparos — marca aparece em 6, sempre em 2ª posição, sentimento positivo → frequência = 60, posição = 70, sentimento = 85, menção = 100 → **GEO Score ≈ 78**.

---

## Fluxo de Processamento de Jobs

**Criação:**
```
Railway Cron (semanal) -->
POST /internal/create-jobs -->
Para cada brand ativa: insere 1 job com status "pending"
```

**Execução (Worker):**
```
Worker faz polling a cada 30s --> busca jobs "pending" -->
Para cada job:
  Para cada keyword (até 10 no Starter):
    Para cada engine (ChatGPT + Gemini):
      1. Monta prompt simulando consumidor real
      2. Chama API da engine
      3. Salva raw_response em query_results
      4. Envia response ao Claude Sonnet:
           - A marca foi mencionada?
           - Em que posição?
           - Sentimento?
      5. Repete 5x a mesma keyword --> calcula frequência
      6. Calcula geo_score --> salva em scores
  Quando todas keywords processadas:
      7. Gera relatório + action_plans via Claude Sonnet
      8. Atualiza job status --> "done"
```

**Tratamento de falha:**
- Job com erro → status `failed`, `error_message` salvo
- Worker reprocessa até 3 tentativas com backoff exponencial
- Após 3 falhas: log + alerta no Railway

---

## Dashboard (Next.js)

| Rota | Conteúdo |
|---|---|
| `/dashboard` | GEO Score atual por engine, variação vs semana anterior |
| `/keywords` | Tabela de score por keyword, filtro por engine |
| `/history` | Gráfico de linha do GEO Score ao longo do tempo |
| `/report` | Último relatório em markdown renderizado |
| `/action-plan` | Recomendações por keyword ordenadas por prioridade |
| `/settings` | Marca, keywords, dados da conta |

---

## Relatório Semanal

Gerado pelo Claude Sonnet. Conteúdo:

1. Resumo executivo (3–4 frases, linguagem acessível para PME)
2. Score por engine com comparação à semana anterior
3. Keywords com melhor e pior desempenho
4. Top 3 ações concretas da semana (dos `action_plans`)
5. Trecho real de uma resposta das LLMs mencionando (ou não) a marca

---

## Plano de Ação por Keyword

Gerado pelo Claude Sonnet, específico por keyword+engine.

**Exemplo de output para "clínica odontológica Campinas":**
> "O Gemini não menciona sua clínica nessa busca. As 3 clínicas citadas têm em comum: perfil Google Business com mais de 50 avaliações e um artigo publicado sobre 'implante dentário em Campinas'. Recomendação: publique um artigo com esse título no seu site e atualize seu Google Business com a especialidade."

---

## Escopo do MVP

### Dentro do MVP

| Componente | Detalhe |
|---|---|
| Auth | Supabase Auth (email/senha) |
| Onboarding | Cadastro de 1 marca + até 10 keywords |
| Engines | ChatGPT (GPT-4o-mini) + Gemini (Flash) |
| Scheduler | Railway Cron semanal |
| Worker | Polling, 5 disparos/keyword, retry 3x |
| Scoring | GEO Score com os 4 fatores |
| Dashboard | 6 páginas |
| Relatório | Claude Sonnet, markdown renderizado |
| Plano de ação | Por keyword, com prioridade |
| Plano | Apenas Starter (1 marca, 10 keywords, semanal) |

### Fora do MVP (fase 2+)

- Planos Pro e Agency (multi-marca, alertas, white-label PDF, subdomínio)
- Perplexity como 3ª engine
- Relatório diário
- Exportação PDF
- Multi-usuário por organização
- Integração com Google Business Profile

---

## Modelo de Negócio

| Tier | Preço | O que inclui |
|---|---|---|
| Starter | R$149/mês | 1 marca, 10 keywords, relatório semanal |
| Pro | R$399/mês | 3 marcas, 30 keywords, alertas, plano de ação IA |
| Agency | R$799/mês | Ilimitado, white-label, PDF com marca da agência |

**Meta conservadora:** 30 clientes em 6 meses = ~R$9k MRR.

---

## Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Churn por falta de resultado | Validar com 5 piloto por 60 dias antes de escalar |
| Incumbente lança feature similar | Nichar agressivamente em advocacia ou saúde |
| APIs das LLMs mudam | Arquitetura modular — cada engine é um conector isolado |
| Educação de mercado | Entrar primeiro por agências que já têm o vocabulário |

---

## Critério de Sucesso do Piloto (60 dias)

5 clientes ativos com GEO Score mensurável e pelo menos 1 subindo após seguir o plano de ação. Se nenhum score melhorar, o produto não está pronto para escalar.
