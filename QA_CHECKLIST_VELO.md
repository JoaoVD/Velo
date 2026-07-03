# QA Checklist — Velo MVP
> Execute do zero, em produção, com um email novo que nunca foi usado no sistema.
> Marque cada item conforme testa. Só poste nas redes quando tudo estiver ✅.

---

## PRÉ-REQUISITO: Ambiente de teste

Antes de começar:
- [ ] Abra o DevTools (F12) — aba Console e Network abertas durante todos os testes
- [ ] Use um email novo que nunca cadastrou no Velo (ex: seuemail+teste1@gmail.com)
- [ ] Tenha o Railway dashboard aberto em outra aba para monitorar logs
- [ ] Tenha o Supabase dashboard aberto (Authentication + Table Editor)
- [ ] Teste em desktop Chrome primeiro, depois mobile

---

## BLOCO 1 — Autenticação

### 1.1 Cadastro
- [ ] Acessa `velo.com.br` — landing page carrega sem erro no console
- [ ] Clica em "Começar grátis" — redireciona para `/auth/signup`
- [ ] Preenche email + senha (mín. 8 caracteres) — sem erro de validação
- [ ] Clica em cadastrar — aparece tela "Verifique seu e-mail"
- [ ] **Verifica Supabase → Authentication → Users** — usuário aparece com status "Unconfirmed"
- [ ] **Verifica caixa de entrada** — email chegou em < 2 minutos
- [ ] Email tem remetente "Velo <noreply@velo.com.br>" (não "Supabase Auth")
- [ ] Email está em português, com template da Velo (logo, teal, não genérico)
- [ ] Clica no link do email — redireciona para `velo.com.br/onboarding` (não localhost)
- [ ] **Verifica Supabase → Authentication → Users** — status mudou para "Confirmed"
- [ ] **Verifica Supabase → Table Editor → organizations** — organização foi criada automaticamente
- [ ] **Verifica Supabase → Table Editor → user_organizations** — vínculo usuário↔org existe

**Se falhar aqui:** verificar Site URL + Redirect URLs no Supabase → Auth → URL Configuration

---

### 1.2 Login e sessão
- [ ] Faz logout (botão na sidebar)
- [ ] Tenta acessar `/dashboard` diretamente — redireciona para `/auth/login`
- [ ] Faz login com o email cadastrado — redireciona para `/dashboard` ou `/onboarding`
- [ ] Fecha o navegador, abre novamente e acessa `velo.com.br` — sessão persiste (não pede login)
- [ ] Testa login com senha errada — aparece mensagem de erro clara em português

---

## BLOCO 2 — Onboarding

### 2.1 Fluxo de cadastro de marca
- [ ] Após confirmar email, está em `/onboarding`
- [ ] Preenche nome da empresa: "Clínica Teste QA"
- [ ] Preenche site: "https://clinicateste.com.br"
- [ ] Seleciona setor: "Saúde"
- [ ] Avança para o passo 2
- [ ] Adiciona 3 keywords:
  - "clínica odontológica campinas"
  - "implante dentário campinas"
  - "dentista sem dor campinas"
- [ ] Avança para o passo 3
- [ ] Adiciona 1 concorrente: "Clínica Rival"
- [ ] Clica "Iniciar monitoramento →"
- [ ] **Verifica Supabase → brands** — marca criada com organization_id correto
- [ ] **Verifica Supabase → keywords** — 3 keywords criadas com brand_id correto
- [ ] Redireciona para `/dashboard` com toast "Primeiro scan agendado!"
- [ ] Dashboard exibe estado de "Scan em andamento" (empty state correto, não erro 500)

**Se falhar aqui:** verificar se a migration foi aplicada e se o trigger de org foi criado

---

### 2.2 Proteção de rotas
- [ ] Abre aba anônima, tenta `/dashboard` — redireciona para `/auth/login` ✅
- [ ] Usuário logado SEM marca tenta `/dashboard` — redireciona para `/onboarding` ✅
- [ ] Usuário logado COM marca tenta `/onboarding` — redireciona para `/dashboard` ✅

---

## BLOCO 3 — Worker e Cron (o mais crítico)

### 3.1 Disparar scan manualmente
- [ ] No dashboard, clica botão "Forçar scan" (ou acessa diretamente)
- [ ] Abre Railway → Logs do serviço **API** — confirma que recebeu `POST /internal/create-jobs`
- [ ] **Verifica Supabase → jobs** — registro criado com `status: pending`
- [ ] Abre Railway → Logs do serviço **Worker** — confirma que o worker está rodando (poll a cada 30s)
- [ ] Aguarda até 2 minutos — **Verifica Supabase → jobs** — status mudou para `processing`

### 3.2 Execução completa do job
- [ ] Aguarda o job completar (5–15 minutos dependendo das APIs)
- [ ] **Verifica Supabase → jobs** — status mudou para `completed`
- [ ] **Verifica Supabase → query_results** — registros criados (1 por keyword × engine)
- [ ] **Verifica Supabase → scores** — registros criados com geo_score preenchido (0–100)
- [ ] **Verifica Supabase → action_plans** — registros criados com recommendation preenchida
- [ ] **Verifica Supabase → reports** — registro criado com content_md preenchido

**Se o job ficar em `pending` por mais de 5 minutos:**
- Worker não está rodando em produção → verificar serviço Worker no Railway
- Verificar variáveis de ambiente do Worker (SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY)

**Se o job ficar em `processing` e travar:**
- Verificar logs do Worker no Railway para ver qual etapa falha
- Causas comuns: API key inválida, rate limit, timeout de rede

**Se o job ir para `failed`:**
- Verificar campo `error_message` na tabela jobs
- Worker tenta até 3 vezes (backoff 60s/120s/300s)

### 3.3 Cron automático
- [ ] Verifica Railway → serviço Cron — está configurado e ativo
- [ ] Schedule configurado: `0 6 * * *` (todo dia às 6h)
- [ ] Testa disparo manual do cron: executa o trigger.py manualmente via Railway → Run Command
- [ ] Confirma que cria novo job na tabela jobs após o disparo

---

## BLOCO 4 — Dashboard com dados reais

*(Execute este bloco APÓS o Bloco 3 completar com sucesso)*

### 4.1 Métricas principais
- [ ] Acessa `/dashboard` — página carrega sem erro 500
- [ ] GEO Score Geral exibe número real (0–100), não zero ou placeholder
- [ ] Score ChatGPT exibe valor real
- [ ] Score Gemini exibe valor real
- [ ] Badge de tendência exibe "↑ +X pts" ou "↓ -X pts" (não vazio)
- [ ] Cores corretas: score alto (≥70) verde, médio (40–69) teal, baixo (<40) vermelho

### 4.2 Gráfico de histórico
- [ ] Gráfico de linha aparece com pelo menos 1 ponto de dados
- [ ] Tooltip ao hover exibe score e data
- [ ] Legenda diferencia ChatGPT de Gemini

### 4.3 Tabela de keywords
- [ ] Tabela exibe as 3 keywords cadastradas
- [ ] Cada keyword tem score por engine
- [ ] Nenhuma coluna exibe "undefined", "null" ou "NaN"

### 4.4 Labels de fonte (compliance obrigatório)
- [ ] Em qualquer lugar que exibe resposta bruta de LLM: label "Resposta do ChatGPT" ou "Resposta do Gemini" visível
- [ ] Nunca exibe output de LLM sem atribuição

---

## BLOCO 5 — Páginas internas

### 5.1 Keywords (`/keywords`)
- [ ] Página carrega sem erro
- [ ] Lista as 3 keywords com último score por engine
- [ ] Tendência (↑↓→) calculada corretamente

### 5.2 Histórico (`/history`)
- [ ] Página carrega sem erro
- [ ] Exibe histórico filtrado por engine
- [ ] Filtro de engine funciona (ChatGPT / Gemini)

### 5.3 Relatório (`/report`)
- [ ] Página carrega sem erro
- [ ] Exibe conteúdo do relatório em markdown renderizado
- [ ] Header com período correto (ex: "23–29 jun 2025")
- [ ] Tipografia correta: Fraunces para títulos, IBM Plex Mono para corpo
- [ ] Botão "Baixar PDF" aparece desabilitado com tooltip (pdf_url é null no MVP)

### 5.4 Plano de ação (`/action-plan`)
- [ ] Página carrega sem erro
- [ ] Cards agrupados por prioridade: Alta → Média → Baixa
- [ ] Badge de prioridade com cor correta
- [ ] Label de engine em cada card ("Resposta do ChatGPT" / "Resposta do Gemini")
- [ ] Texto das recomendações em português

### 5.5 Configurações (`/settings`)
- [ ] Exibe marca cadastrada com nome, site e setor
- [ ] Botão "Editar" abre modal com dados preenchidos
- [ ] Lista as 3 keywords com botão de remover (×)
- [ ] Remove uma keyword → lista atualiza sem reload da página
- [ ] Adiciona nova keyword → lista atualiza sem reload
- [ ] Contador "X / 10" atualiza corretamente
- [ ] Tenta adicionar 11ª keyword → input desabilita com mensagem de limite
- [ ] Lista de concorrentes exibe e permite adicionar/remover

---

## BLOCO 6 — Email transacional

### 6.1 Email de relatório semanal
- [ ] Após o scan completar (Bloco 3), verifica caixa de entrada
- [ ] Email de relatório chegou em < 30 minutos após scan concluído
- [ ] Remetente: "Velo <noreply@velo.com.br>"
- [ ] Assunto: "Seu GEO Score da semana — [nome da marca]"
- [ ] Email exibe GEO Score como número grande centralizado
- [ ] Variação de pontos exibe corretamente (↑ ou ↓)
- [ ] Destaque da semana exibe a primeira recomendação do plano de ação
- [ ] Botão "Ver relatório completo →" leva para `velo.com.br/report` (não localhost)
- [ ] Email renderiza bem no Gmail (desktop e mobile)
- [ ] Email não cai no spam (verificar pasta de spam)

**Se email não chegar:**
1. Verificar Railway → Worker logs — confirma que `send_weekly_report_email` foi chamada
2. Verificar Resend dashboard → Emails — confirma que email foi enviado (status: delivered)
3. Se status "bounced": verificar se domínio tem SPF/DKIM configurado no Resend
4. Se status "spam": adicionar registro DMARC no DNS

### 6.2 Email de confirmação de cadastro
*(Já testado no Bloco 1 — confirmar aqui que todos os links funcionam)*
- [ ] Link "Confirmar e-mail →" no corpo do email funciona
- [ ] Link alternativo em texto simples também funciona
- [ ] Links de Privacidade e Termos no footer não retornam 404

---

## BLOCO 7 — Settings e configurações

### 7.1 Sidebar
- [ ] Todos os links de navegação funcionam
- [ ] Item ativo tem destaque visual correto (fundo teal/10, barra esquerda)
- [ ] Logo "Velo" no topo da sidebar visível
- [ ] Badge do plano "STARTER" no rodapé da sidebar
- [ ] Botão "Sair" faz logout e redireciona para `/`
- [ ] Email do usuário exibido no rodapé da sidebar

### 7.2 Página de pricing (`/pricing`)
- [ ] Página carrega sem erro
- [ ] 3 planos exibidos: Starter, Pro (badge "Mais escolhido"), Agency
- [ ] Toggle mensal/anual funciona
- [ ] Botão "Fazer upgrade" abre modal "Em breve" com campo de email
- [ ] Submissão do modal salva na tabela `upgrade_interest` no Supabase
- [ ] Botão "Falar com a equipe" (Agency) abre mailto:

---

## BLOCO 8 — Responsividade mobile

*(Teste em Chrome DevTools → device toolbar, ou no celular real)*

- [ ] Landing page (`/`) — hero legível, CTA clicável, sem overflow horizontal
- [ ] `/auth/signup` — formulário usável no mobile
- [ ] `/onboarding` — steps navegáveis, inputs funcionais
- [ ] `/dashboard` — cards empilham verticalmente, gráfico redimensiona
- [ ] `/settings` — listas de keywords e concorrentes utilizáveis
- [ ] Sidebar — colapsa em mobile, menu hamburguer funcional
- [ ] Nenhuma página tem scroll horizontal indesejado

---

## BLOCO 9 — Performance e erros

### 9.1 Console limpo
- [ ] Landing page — zero erros no console
- [ ] Dashboard — zero erros no console
- [ ] Settings — zero erros no console
- [ ] Nenhum warning de "Missing key" no React
- [ ] Nenhum 401/403/500 na aba Network (exceto rotas esperadas)

### 9.2 Estados de erro
- [ ] Simula backend offline (para Railway temporariamente) — frontend exibe mensagem de erro amigável, não tela branca
- [ ] Tenta adicionar keyword duplicada — exibe erro em português
- [ ] Tenta cadastrar email já existente — exibe erro claro

### 9.3 Loading states
- [ ] Dashboard exibe skeleton loader enquanto carrega dados (não tela em branco)
- [ ] Botões de ação exibem loading spinner ao clicar (não ficam clicáveis duas vezes)

---

## BLOCO 10 — Verificação final de produção

### 10.1 Railway
- [ ] Serviço **API** — status: Active, health check `/health` retorna 200
- [ ] Serviço **Worker** — status: Active, logs mostram poll ativo
- [ ] Serviço **Cron** — status: Active, próxima execução agendada
- [ ] Todas as variáveis de ambiente configuradas nos 3 serviços

### 10.2 Vercel
- [ ] Deploy mais recente: status Success
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Domínio `velo.com.br` apontando para Vercel (CNAME configurado)
- [ ] HTTPS ativo (cadeado no browser)

### 10.3 Supabase
- [ ] Todas as tabelas existem (organizations, brands, keywords, jobs, query_results, scores, reports, action_plans, user_organizations)
- [ ] RLS habilitada em todas as tabelas
- [ ] Trigger `on_auth_user_created` existe e está ativo
- [ ] Site URL configurada como `https://velo.com.br`
- [ ] Redirect URLs incluem `https://velo.com.br/**` e `http://localhost:3000/**`
- [ ] SMTP customizado configurado (Resend)

### 10.4 Resend
- [ ] Domínio `velo.com.br` verificado (SPF ✅, DKIM ✅)
- [ ] Status do domínio: "Verified" (não "Pending")
- [ ] Email de teste enviado com sucesso via dashboard do Resend

---

## BLOCO 11 — Teste de regressão (segundo usuário)

Repita os Blocos 1 e 2 com um **segundo email diferente** para garantir que o sistema funciona para múltiplos usuários:

- [ ] Segundo usuário consegue se cadastrar
- [ ] Segundo usuário tem organização própria (isolada do primeiro)
- [ ] Segundo usuário NÃO vê dados do primeiro usuário (RLS funcionando)
- [ ] Segundo usuário consegue completar onboarding independentemente

---

## RESULTADO FINAL

### ✅ Pronto para lançar nas redes quando:
- Blocos 1, 2, 3 e 4 completos sem falha crítica
- Email de confirmação funcionando (Bloco 6.2)
- Email de relatório chegando (Bloco 6.1)
- Zero erros 500 em produção (Bloco 9)
- Teste com segundo usuário passou (Bloco 11)

### ⚠️ Pode lançar com ressalva quando:
- Mobile tem pequenos problemas visuais não-críticos
- Botão de PDF desabilitado (esperado no MVP)
- Pricing sem Stripe real (esperado no MVP)

### ❌ NÃO lançar se:
- Job de scan não completa em produção (Bloco 3 falhando)
- Dashboard exibe zeros ou erros após scan (Bloco 4)
- Email não chega (Bloco 6)
- Segundo usuário vê dados do primeiro (RLS quebrado)
- Qualquer erro 500 em fluxo crítico

---

## BUGS ENCONTRADOS
*(preencha aqui conforme testa)*

| # | Bloco | Descrição do bug | Severidade | Status |
|---|-------|-----------------|------------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

*QA executado em: ___/___/2025*
*Testado por: João Dalseno*
*Ambiente: Produção (velo.com.br)*
*Email de teste usado: _______________________*
