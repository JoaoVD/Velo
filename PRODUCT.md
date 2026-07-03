# Velo — Product & Brand Bible

> Este arquivo é a fonte de verdade do produto. O Claude Code deve ler este documento antes de qualquer tarefa de desenvolvimento, design ou copy. Nunca use placeholder, nunca invente detalhes não documentados aqui — pergunte ao João antes.

---

## 1. Identidade

| Campo | Valor |
|-------|-------|
| **Nome** | Velo |
| **Tagline** | "Monitore sua presença nas IAs em tempo real." |
| **Categoria** | GEO SaaS (Generative Engine Optimization) |
| **Mercado** | B2B · Brasil |
| **Estágio** | Pre-MVP · 2025–2026 |
| **Domínio principal** | velo.com.br |
| **Domínio alternativo** | getvelo.io |

### O que é a Velo

A Velo é uma plataforma B2B SaaS que monitora automaticamente como as principais IAs generativas (ChatGPT, Gemini, Perplexity, Claude) descrevem, citam e recomendam uma marca — e gera um plano de ação para melhorar essa presença.

### O que a Velo não é

- Não é uma ferramenta de SEO tradicional
- Não é um chatbot ou assistente de IA
- Não é uma ferramenta de geração de conteúdo genérico
- Não promete resultado garantido de aparição nas IAs

---

## 2. Problema & Solução

### Problema

As IAs generativas (ChatGPT, Perplexity, Gemini, Claude) estão se tornando o novo ponto de entrada para decisões de compra e contratação no Brasil. Quando alguém pergunta "qual advogado trabalhista em SP você recomenda?" ou "melhor clínica odontológica em Campinas", as LLMs respondem com nomes específicos. A maioria das empresas brasileiras não sabe se aparece, como aparece, ou se está sendo preterida por concorrentes.

Não existe hoje, no Brasil, uma ferramenta acessível que monitore isso de forma contínua e em português-BR.

### Solução

A Velo consulta periodicamente as LLMs com prompts que simulam perguntas reais de consumidores, analisa as respostas com IA (Claude), calcula um "GEO Score" (0–100) por engine e por keyword, armazena o histórico, e entrega ao cliente:

1. Dashboard com score atual, evolução e benchmark vs. concorrentes
2. Alertas proativos quando o score cai ou concorrente ultrapassa
3. Plano de ação gerado por IA com recomendações específicas de conteúdo

---

## 3. Público-alvo

### Primário — canal direto

- **PMEs de serviços com restrição de publicidade**: escritórios de advocacia (OAB limita propaganda), clínicas de saúde (CFM, CRP, CRO), consultórios de psicologia e nutrição
- Perfil: empresa com 1–20 funcionários, já investe em presença digital, entende SEO básico, ticket de serviço alto (R$3k+/mês por cliente final)

### Secundário — canal de revenda

- **Agências de marketing digital**: especialmente as que já vendem SEO e precisam de GEO como upsell
- Perfil: agência com 5–30 clientes ativos, usa ferramentas como RD Station e SEMrush, precisa de relatório white-label para justificar fee mensal

### Quem não é o público

- E-commerces de baixo ticket (< R$100 por pedido)
- Empresas sem presença digital estabelecida
- Grandes corporações com equipe de marketing interna robusta (por ora)

---

## 4. Posicionamento

### Statement

"Para agências e PMEs brasileiras que investem em presença digital mas não sabem como aparecem nas buscas por IA, a Velo é a plataforma de inteligência GEO que monitora, pontua e orienta — enquanto os concorrentes só mostram dados sem direção."

### Diferencial competitivo

| | Velo | RD Station Radar GEO | Promptado / naia | SEMrush / Ahrefs |
|---|---|---|---|---|
| Foco em português-BR | ✓ | ✓ | ✓ | ✗ |
| Multi-engine (4+ LLMs) | ✓ | ✗ | ✓ | Parcial |
| Plano de ação por IA | ✓ | ✗ | ✗ | ✗ |
| White-label para agências | ✓ | ✗ | ✗ | ✗ |
| Preço em BRL + Pix | ✓ | ✓ | ✓ | ✗ |

### Os 3 pilares de comunicação

1. **Visibilidade** — Você aparece quando importa? Saiba exatamente como ChatGPT, Gemini e Perplexity descrevem sua marca hoje.
2. **Inteligência** — Score comparativo, histórico de evolução e benchmarks vs. concorrentes em linguagem de negócio.
3. **Ação** — Um plano de conteúdo gerado por IA para subir o score. Monitoramento que resulta em movimento.

---

## 5. Modelo de Negócio

### Planos e preços

| Tier | Preço | Marcas | Keywords | Frequência | Extras |
|------|-------|--------|----------|------------|--------|
| **Starter** | R$149/mês | 1 | 10 | Semanal | Relatório e-mail |
| **Pro** | R$399/mês | 3 | 30 | Diária | Alertas + plano de ação IA |
| **Agency** | R$799/mês | Ilimitado | Ilimitado | Diária | White-label + PDF com marca da agência |

### Pagamento

- Stripe com checkout em BRL
- Pix como opção obrigatória (decisivo para PMEs brasileiras)
- Desconto anual: 15–20% (a definir)

### Custo de IA por cliente (referência)

- Claude Haiku 4.5: US$1/M tokens input, US$5/M tokens output
- Custo estimado por cliente com 20 keywords × 4 engines × frequência diária: ~US$5/mês
- Usar prompt caching e Batch API para manter margem

---

## 6. Identidade Visual

### Paleta de cores

```
--color-ink:       #0f1923   /* cor principal, textos, fundo escuro */
--color-navy:      #1a3a5c   /* azul profundo, elementos secundários */
--color-signal:    #3f6b4e   /* verde musgo, acento principal, CTAs */
--color-ice:       #e8f0f7   /* fundo de seções de dados, cards */
--color-bone:      #f5f2eb   /* fundo claro principal */
--color-confirm:   #2d6a4f   /* verde, métricas positivas, scores altos */
```

**Uso:**
- Fundo padrão: `--color-bone` (claro) ou `--color-ink` (escuro)
- CTA principal, destaques, acento: `--color-signal`
- Dados e dashboards: `--color-ice` como fundo de cards
- Métricas positivas, scores em alta, confirmações: `--color-confirm`
- Nunca usar gradientes purple/azul — já é clichê no mercado de SaaS de IA

### Tipografia

```
Display / Headlines:  Fraunces (serif óptico, Google Fonts)
                      weights: 300, 700, 900 — italic quando elegância
UI / Dados / Código:  IBM Plex Mono (monospace, Google Fonts)
                      weights: 300, 400, 500, 600
```

**Regras:**
- Títulos de página: Fraunces 700–900, letter-spacing: -0.02em
- Scores e métricas grandes: Fraunces 900
- Labels, tags, código, metadados: IBM Plex Mono 400–500
- Corpo de texto e parágrafos: IBM Plex Mono 300, line-height: 1.7
- Nunca usar Roboto, Arial ou Space Grotesk
- **Exceção (landing page):** a landing usa Manrope (títulos) + Inter (corpo), aproximando a tipografia da Semrush (Factor A + Inter) — decisão de 2026-07-03. O app segue Fraunces + IBM Plex Mono.

### Logo

- Nome "Velo" em Fraunces Bold (700), sem maiúsculas forçadas
- O "e" ou detalhe tipográfico em `--color-signal` (#3f6b4e)
- Sem ícone complexo no MVP — wordmark é suficiente
- Sem símbolo de IA, cérebro, circuito ou engrenagem — clichê
- Variações obrigatórias: fundo escuro (ink) e fundo claro (bone)

### Tom visual geral

- Técnico e editorial, como um relatório de analytics bem desenhado
- Sem gradientes excessivos, sem glassmorphism, sem sombras suaves demais
- Bordas definidas, espaçamento generoso, hierarquia clara
- Referências visuais: Ahrefs, Linear, Oxide — não Canva, não Hotmart

---

## 7. Tom de Voz

### Personalidade

Analista sênior. Fala com dados, não com hype. Direto, técnico, baseado em evidências. Nunca promete o que não pode garantir.

### É

- Direto e objetivo
- Baseado em dados reais
- Confiável e preciso
- Profissional sem ser frio

### Não é

- "Revolucionário", "disruptivo", "transformador"
- Promessas vagas ("domine as IAs", "seja o número 1")
- Exclamações excessivas
- Emojis no produto (pode usar com moderação em redes sociais)

### Exemplos de copy

**Certo:**
- "O ChatGPT mencionou seu concorrente 3x mais que você esta semana. Aqui está o plano para mudar isso."
- "Seu GEO Score caiu 12 pontos no Perplexity. Veja o que mudou."
- "Você aparece em 23% das buscas. Seu concorrente principal aparece em 61%."

**Errado:**
- "Domine o futuro das buscas com IA revolucionária!"
- "Seja encontrado por milhões de clientes nas IAs!"
- "A plataforma que vai transformar seu negócio digitalmente."

### Frases-chave por canal

- **Cold outreach para agências:** "Você sabe mostrar ROI de SEO para clientes. E GEO nas IAs — já tem esse relatório?"
- **LinkedIn (conteúdo):** "Testei como o ChatGPT descreve escritórios de advocacia em SP. O resultado vai te surpreender."
- **Landing page headline:** "O que as IAs falam sobre você quando ninguém está olhando."
- **E-mail de prospecção:** "Rodei uma análise rápida da [empresa] no ChatGPT e Perplexity. Posso te mandar o resultado?"

---

## 8. Stack Técnico

```
Frontend:     Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
Backend:      FastAPI (Python) no Railway
Banco:        Supabase (PostgreSQL + RLS por usuário)
IA análise:   Claude API (Anthropic) — Haiku 4.5 para análise, Sonnet para plano de ação
LLMs monit.:  OpenAI API (ChatGPT), Perplexity API, Google Gemini API
Cron jobs:    Railway cron (scans diários/semanais por tier)
Pagamento:    Stripe + Pix
E-mail:       Resend
Monitoramento: Sentry + PostHog
Deploy:       Vercel (frontend) + Railway (backend)
```

### Regras de desenvolvimento

- Nunca hardcodar API keys, IPs, tokens ou credenciais — sempre via variáveis de ambiente
- Ler valores sensíveis do módulo `config/settings` do projeto
- RLS obrigatório no Supabase — nenhuma tabela sem Row Level Security
- Cada engine de LLM é um conector isolado e independente (arquitetura modular)
- Prompt caching e Batch API do Claude sempre que possível para reduzir custo
- LGPD: dados de PF só com base legal explícita (contrato de serviço)

---

## 9. Engines Monitoradas

### MVP (V1)

| Engine | API | Observação |
|--------|-----|------------|
| ChatGPT | OpenAI API (chat completions) | Principal — maior share de busca por IA no BR |
| Perplexity | Perplexity API oficial | Exige label de fonte nos outputs exibidos |

### V2

| Engine | API |
|--------|-----|
| Gemini | Google Generative AI API (tier pago obrigatório) |
| Claude | Anthropic API |

### V3 (futuro)

- Meta AI (WhatsApp — relevantíssimo no Brasil)
- Microsoft Copilot

---

## 10. Compliance & Legal

- Usar **exclusivamente APIs pagas** de todas as engines — nunca scraping da interface web
- Exibir label de fonte em todo snapshot de resposta de LLM no dashboard ("Resposta do Perplexity", "Resposta do ChatGPT")
- Nunca exibir output de LLM como se fosse análise própria da Velo sem disclosure
- Nunca prometer resultado garantido de aparição nas IAs (risco CDC art. 37 — publicidade enganosa)
- Política de Privacidade + Termos de Uso obrigatórios antes do primeiro cliente pagante
- LGPD: base legal = contrato de serviço; mencionar retenção de dados do Google (55 dias) na PP

---

## 11. Métricas de Sucesso

| Métrica | Meta |
|---------|------|
| Inscritos na landing (semana 2) | 20 qualificados |
| Entrevistas de problema | 10 até semana 2 |
| Clientes piloto (semana 8) | 5–10 pagantes |
| MRR (mês 3) | R$3.000 |
| Churn mensal máximo | 10%/mês |
| Clientes com score crescente após 60 dias | >60% |

### Kill switches

- **Semana 2:** Se não atingir 20 inscritos qualificados → trocar nicho ou posicionamento antes de codar
- **Semana 8:** Se >40% dos clientes piloto não virem melhora no score → reformular plano de ação antes de escalar

---

## 12. O que não construir no MVP

- White-label (V2)
- Integração Gemini e Claude como engines monitoradas (V2)
- API pública para agências (V2)
- Geração automática de conteúdo (V3)
- App mobile (indefinido)
- Integração com ferramentas de SEO externas (V3)

---

*Última atualização: junho 2025 · Responsável: João Dalseno*
