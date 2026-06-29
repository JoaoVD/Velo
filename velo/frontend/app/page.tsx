"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

/* ─── Simulated AI responses for the demo section ─── */
const DEMO_RESPONSES = [
  {
    id: 0,
    query: "melhores advogados trabalhistas em São Paulo",
    engine: "ChatGPT",
    text: "Entre os escritórios de advocacia trabalhista mais recomendados em São Paulo, destaco: 1. Carvalho & Associados — 20 anos de experiência em causas trabalhistas complexas; 2. Silva & Pereira Advocacia — especialistas com alta taxa de êxito; 3. Lima Direito do Trabalho — atendimento humanizado e equipe sênior.",
    mentioned: false,
    brand: "Advocacia Moura",
  },
  {
    id: 1,
    query: "clínica de implante dentário recomendada em Campinas",
    engine: "Gemini",
    text: "Para implantes dentários em Campinas, recomendo a Clínica Sorriso, referência em implantodontia com tecnologia digital e equipe especializada. Em segundo lugar, a OdontoCampinas e a Clínica Dr. Paulo Mendes também são bem avaliadas pelos pacientes.",
    mentioned: true,
    brand: "Clínica Sorriso",
    highlight: "Clínica Sorriso",
  },
  {
    id: 2,
    query: "nutricionista esportiva online no Brasil",
    engine: "ChatGPT",
    text: "Há boas opções de nutricionistas esportivas que atendem online no Brasil. Recomendo buscar profissionais registradas no CRN com especialização em nutrição esportiva. Plataformas como Doctoralia, Vacina Certa e Instagram são bons pontos de partida para encontrar profissionais avaliados.",
    mentioned: false,
    brand: "Nutri Performance",
  },
];

/* ─── Typewriter component ─── */
function TypewriterText({
  text,
  highlight,
  speed = 16,
}: {
  text: string;
  highlight?: string;
  speed?: number;
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        setDone(true);
        clearInterval(id);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  if (!highlight || !done) {
    return (
      <>
        {displayed}
        {!done && (
          <span className="inline-block w-0.5 h-3.5 bg-ink/60 align-middle ml-0.5 animate-pulse" />
        )}
      </>
    );
  }

  const parts = displayed.split(new RegExp(`(${highlight})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-confirm/20 text-confirm rounded px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/* ─── Animated counter ─── */
function AnimatedScore({ target, color }: { target: number; color: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !done.current) {
          done.current = true;
          let i = 0;
          const step = Math.max(1, Math.floor(1400 / target));
          const id = setInterval(() => {
            i++;
            setVal(i);
            if (i >= target) clearInterval(id);
          }, step);
        }
      },
      { threshold: 0.6 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return (
    <p ref={ref} className={`font-display font-black text-6xl leading-none ${color}`}>
      {val}
    </p>
  );
}

/* ─── Section fade-in ─── */
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [activeDemo, setActiveDemo] = useState(0);
  const demo = DEMO_RESPONSES[activeDemo];

  /* Auto-rotate demos */
  useEffect(() => {
    const id = setTimeout(
      () => setActiveDemo((p) => (p + 1) % DEMO_RESPONSES.length),
      8000
    );
    return () => clearTimeout(id);
  }, [activeDemo]);

  return (
    <div className="min-h-screen bg-bone overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-bone/95 backdrop-blur-sm border-b border-ink/8">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center">
          <span className="font-display font-black text-xl tracking-tight select-none">
            Vel<span className="text-signal">o</span>
          </span>
          <div className="hidden md:flex items-center gap-8 ml-10">
            <a href="#problema" className="font-mono text-xs text-ink/50 hover:text-ink transition-colors uppercase tracking-wider">
              Problema
            </a>
            <a href="#como-funciona" className="font-mono text-xs text-ink/50 hover:text-ink transition-colors uppercase tracking-wider">
              Como funciona
            </a>
            <a href="#precos" className="font-mono text-xs text-ink/50 hover:text-ink transition-colors uppercase tracking-wider">
              Preços
            </a>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/auth/login"
              className="font-mono text-xs text-ink/60 hover:text-ink transition-colors px-4 py-2"
            >
              Entrar
            </Link>
            <Link
              href="/auth/signup"
              className="font-mono text-xs bg-signal text-white px-4 py-2 rounded-lg hover:bg-signal/90 transition-colors font-medium"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-28">
        {/* Background dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #0f192318 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 bg-white border border-ink/10 rounded-full px-4 py-1.5 mb-8 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-confirm animate-pulse" />
              <span className="font-mono text-xs text-ink/50">GEO SaaS · Brasil · Beta aberto</span>
            </div>

            <h1 className="font-display font-black text-5xl lg:text-[3.5rem] text-ink leading-[1.05] tracking-tight">
              O que as IAs falam<br />
              sobre você quando{" "}
              <em className="text-signal not-italic">ninguém</em>{" "}
              está olhando.
            </h1>

            <p className="mt-7 font-mono text-sm text-ink/55 leading-[1.85] max-w-lg">
              A Velo consulta ChatGPT e Gemini com perguntas reais de consumidores, analisa se sua marca aparece,
              calcula um <strong className="text-ink font-semibold">GEO Score (0–100)</strong> e entrega um plano
              de ação semanal em português — sem jargão, sem promessa vaga.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 bg-signal text-white font-mono text-sm font-semibold px-7 py-3.5 rounded-xl hover:bg-signal/90 transition-colors shadow-lg shadow-signal/20"
              >
                Ver minha presença agora
                <span className="text-base">→</span>
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 border border-ink/15 text-ink font-mono text-sm px-7 py-3.5 rounded-xl hover:bg-ink/5 transition-colors"
              >
                Como funciona
              </a>
            </div>

            <p className="mt-5 font-mono text-xs text-ink/25">
              Sem cartão de crédito · 7 dias grátis · Resultado em &lt; 24h
            </p>
          </div>

          {/* Right — Score mockup card */}
          <div className="relative mt-4 lg:mt-0">
            <div className="bg-white border border-ink/10 rounded-2xl p-6 shadow-2xl shadow-ink/8">
              {/* Card header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-mono text-xs text-ink/35">Clínica Sorriso</p>
                  <p className="font-mono text-xs text-ink/20">Semana de 23–29 jun 2025</p>
                </div>
                <span className="font-mono text-xs bg-confirm/10 text-confirm border border-confirm/20 px-2.5 py-1 rounded-full font-medium">
                  ↑ +11 pts
                </span>
              </div>

              {/* Engine scores */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-ice rounded-xl p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink/35 mb-2">ChatGPT</p>
                  <p className="font-display font-black text-5xl text-signal leading-none">72</p>
                  <p className="font-mono text-[10px] text-ink/25 mt-1">/ 100</p>
                </div>
                <div className="bg-ice rounded-xl p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink/35 mb-2">Gemini</p>
                  <p className="font-display font-black text-5xl text-confirm leading-none">84</p>
                  <p className="font-mono text-[10px] text-ink/25 mt-1">/ 100</p>
                </div>
              </div>

              {/* Keyword rows */}
              <div className="mb-1">
                <p className="font-mono text-[10px] text-ink/30 uppercase tracking-widest mb-3">
                  Keywords monitoradas
                </p>
                {[
                  { term: "implante dentário Campinas", gpt: 81, gem: 92 },
                  { term: "dentista especialista Campinas", gpt: 65, gem: 78 },
                  { term: "clínica odontológica Campinas", gpt: 58, gem: 82 },
                ].map((kw) => (
                  <div key={kw.term} className="flex items-center justify-between py-2 border-b border-ink/5 last:border-0">
                    <span className="font-mono text-xs text-ink/55 truncate flex-1 mr-4">{kw.term}</span>
                    <div className="flex gap-3 shrink-0">
                      <span className={`font-mono text-xs font-semibold ${kw.gpt >= 70 ? "text-confirm" : "text-signal"}`}>{kw.gpt}</span>
                      <span className={`font-mono text-xs font-semibold ${kw.gem >= 70 ? "text-confirm" : "text-signal"}`}>{kw.gem}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating action-plan chip */}
            <div className="absolute -bottom-5 -left-4 bg-white border border-ink/10 rounded-2xl p-4 shadow-xl max-w-[260px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-medium">
                  Alta prioridade
                </span>
              </div>
              <p className="font-mono text-xs text-ink/65 leading-relaxed">
                Publique um artigo sobre &ldquo;implante dentário sem dor&rdquo; com depoimentos reais de pacientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ENGINE STRIP ── */}
      <div className="border-y border-ink/8 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-center gap-8 flex-wrap">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/25">
            Monitoramos em tempo real
          </span>
          <span className="font-mono text-sm font-medium text-ink">ChatGPT</span>
          <span className="w-px h-4 bg-ink/12" />
          <span className="font-mono text-sm font-medium text-ink">Gemini</span>
          <span className="w-px h-4 bg-ink/12" />
          <span className="font-mono text-sm text-ink/30">
            Perplexity <span className="text-[10px]">(em breve)</span>
          </span>
          <span className="w-px h-4 bg-ink/12" />
          <span className="font-mono text-sm text-ink/30">
            Claude <span className="text-[10px]">(em breve)</span>
          </span>
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <section id="problema" className="max-w-6xl mx-auto px-6 py-28">
        <FadeIn>
          <p className="font-mono text-[10px] uppercase tracking-widest text-signal mb-5">O problema</p>
          <h2 className="font-display font-black text-4xl lg:text-5xl text-ink leading-tight mb-8 max-w-2xl">
            Seu cliente pergunta para a IA.{" "}
            <span className="text-ink/25">Você aparece?</span>
          </h2>
          <p className="font-mono text-sm text-ink/55 leading-[1.85] max-w-2xl mb-14">
            ChatGPT, Gemini e Perplexity estão se tornando o novo ponto de entrada para decisões de compra e
            contratação no Brasil. Quando alguém pergunta{" "}
            <em className="text-ink not-italic font-medium">&ldquo;qual advogado trabalhista em SP você recomenda?&rdquo;</em>,
            as IAs respondem com nomes específicos — e a maioria das empresas não sabe se aparece, como aparece,
            ou se está sendo preterida por concorrentes.
          </p>
        </FadeIn>

        {/* Live demo box */}
        <FadeIn delay={100}>
          <div className="bg-white border border-ink/10 rounded-2xl overflow-hidden shadow-sm">
            {/* Window chrome */}
            <div className="border-b border-ink/8 px-6 py-4 flex items-center gap-4 bg-bone/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-ink/10" />
                <div className="w-3 h-3 rounded-full bg-ink/10" />
                <div className="w-3 h-3 rounded-full bg-ink/10" />
              </div>
              <span className="font-mono text-xs text-ink/35 flex-1 text-center">
                Resposta do {demo.engine}
              </span>
              <span
                className={`font-mono text-[10px] px-2.5 py-1 rounded-full font-medium border ${
                  demo.mentioned
                    ? "bg-confirm/10 text-confirm border-confirm/20"
                    : "bg-red-50 text-red-600 border-red-100"
                }`}
              >
                {demo.mentioned ? "✓ Mencionado" : "✗ Não mencionado"}
              </span>
            </div>

            <div className="px-6 py-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink/30 mb-3">
                Pergunta simulada
              </p>
              <p className="font-mono text-xs text-ink/50 italic mb-5">&ldquo;{demo.query}&rdquo;</p>

              <p className="font-mono text-sm text-ink/65 leading-relaxed min-h-[4.5rem]">
                <TypewriterText
                  key={demo.id}
                  text={demo.text}
                  highlight={demo.mentioned ? demo.highlight : undefined}
                />
              </p>

              {demo.mentioned && (
                <div className="mt-5 inline-flex items-center gap-2 bg-confirm/8 border border-confirm/15 rounded-lg px-3 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-confirm" />
                  <span className="font-mono text-xs text-confirm font-medium">
                    {demo.brand} mencionada em 1ª posição com sentimento positivo
                  </span>
                </div>
              )}

              {!demo.mentioned && (
                <div className="mt-5 inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="font-mono text-xs text-red-600 font-medium">
                    {demo.brand} não foi mencionada nesta resposta
                  </span>
                </div>
              )}
            </div>

            {/* Demo tab switcher */}
            <div className="border-t border-ink/8 px-6 py-3 flex gap-2 bg-bone/30">
              {DEMO_RESPONSES.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setActiveDemo(i)}
                  className={`font-mono text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    i === activeDemo
                      ? "bg-ink text-white"
                      : "text-ink/40 hover:text-ink hover:bg-ink/5"
                  }`}
                >
                  Exemplo {i + 1}
                </button>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="como-funciona" className="bg-ink">
        <div className="max-w-6xl mx-auto px-6 py-28">
          <FadeIn>
            <p className="font-mono text-[10px] uppercase tracking-widest text-signal mb-5">
              Como funciona
            </p>
            <h2 className="font-display font-black text-4xl text-white mb-16 max-w-xl leading-tight">
              Três etapas.<br />Um relatório semanal.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                title: "Consultamos as IAs",
                body: "Disparamos 5 perguntas reais de consumidores por keyword, simulando exatamente o que seu cliente perguntaria ao ChatGPT ou Gemini — sem mencionar sua marca.",
              },
              {
                n: "02",
                title: "Calculamos seu GEO Score",
                body: "O Claude analisa cada resposta: sua marca foi mencionada? Em qual posição? Com sentimento positivo? O resultado é um score de 0 a 100, calculado com 4 fatores ponderados.",
              },
              {
                n: "03",
                title: "Entregamos o plano de ação",
                body: "Todo relatório vem com recomendações específicas priorizadas por urgência: tipos de conteúdo, plataformas e ações concretas — sem jargão, direto ao ponto.",
              },
            ].map((step, i) => (
              <FadeIn key={step.n} delay={i * 80}>
                <div className="border border-white/8 rounded-2xl p-8 h-full hover:border-signal/30 transition-colors">
                  <span className="font-display font-black text-6xl text-signal/20 leading-none block mb-5">
                    {step.n}
                  </span>
                  <h3 className="font-mono text-sm font-semibold text-white mb-3">{step.title}</h3>
                  <p className="font-mono text-sm text-white/40 leading-relaxed">{step.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── GEO SCORE SECTION ── */}
      <section className="max-w-6xl mx-auto px-6 py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <p className="font-mono text-[10px] uppercase tracking-widest text-signal mb-5">GEO Score</p>
            <h2 className="font-display font-black text-4xl text-ink leading-tight mb-6">
              Um número.<br />Quatro fatores.
            </h2>
            <p className="font-mono text-sm text-ink/55 leading-relaxed mb-8">
              O GEO Score combina menção (30%), posição (25%), sentimento (25%) e frequência (20%)
              numa escala de 0 a 100 — em linguagem de negócio, não de engenharia.
            </p>
            <div className="space-y-4">
              {[
                { label: "Menção", pct: 30, desc: "Sua marca apareceu na resposta?" },
                { label: "Posição", pct: 25, desc: "Em qual lugar da lista ela aparece?" },
                { label: "Sentimento", pct: 25, desc: "A IA fala bem ou mal da sua marca?" },
                { label: "Frequência", pct: 20, desc: "Em quantas das 5 consultas ela apareceu?" },
              ].map((f) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-semibold text-ink">{f.label}</span>
                    <span className="font-mono text-xs text-signal font-semibold">{f.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-ink/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-signal rounded-full"
                      style={{ width: `${f.pct * 3}%` }}
                    />
                  </div>
                  <p className="font-mono text-[10px] text-ink/35 mt-1">{f.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={120}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { engine: "ChatGPT", score: 72, color: "text-signal" },
                { engine: "Gemini", score: 84, color: "text-confirm" },
              ].map((e) => (
                <div key={e.engine} className="bg-ice border border-ink/8 rounded-2xl p-6 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink/35 mb-4">
                    {e.engine}
                  </p>
                  <AnimatedScore target={e.score} color={e.color} />
                  <p className="font-mono text-[10px] text-ink/25 mt-2">/ 100</p>
                </div>
              ))}
              <div className="col-span-2 bg-white border border-ink/10 rounded-2xl p-5">
                <p className="font-mono text-xs text-ink/35 mb-3 uppercase tracking-widest text-[10px]">
                  Interpretação do score
                </p>
                {[
                  { range: "70–100", label: "Boa presença", color: "bg-confirm" },
                  { range: "40–69", label: "Presença moderada", color: "bg-signal" },
                  { range: "0–39",  label: "Baixa visibilidade", color: "bg-red-400" },
                ].map((r) => (
                  <div key={r.range} className="flex items-center gap-3 mb-2 last:mb-0">
                    <span className={`w-2 h-2 rounded-full ${r.color} shrink-0`} />
                    <span className="font-mono text-xs text-ink/55">{r.range}</span>
                    <span className="font-mono text-xs text-ink/35">{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="bg-ice/60 border-y border-ink/8">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <FadeIn>
            <p className="font-mono text-[10px] uppercase tracking-widest text-signal mb-5">Funcionalidades</p>
            <h2 className="font-display font-black text-4xl text-ink mb-14 max-w-lg leading-tight">
              Tudo para monitorar sua presença nas IAs.
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: "◎",
                title: "GEO Score 0–100",
                body: "Score composto, em linguagem de negócio. Não requer conhecimento técnico para interpretar.",
              },
              {
                icon: "⟳",
                title: "Monitoramento contínuo",
                body: "Semanal no Starter, diário no Pro. Você vê a curva de evolução ao longo do tempo.",
              },
              {
                icon: "⊞",
                title: "Multi-engine",
                body: "ChatGPT e Gemini no MVP. Perplexity e Claude chegam no próximo ciclo.",
              },
              {
                icon: "↯",
                title: "Plano de ação por IA",
                body: "Recomendações concretas por keyword — tipo de conteúdo, plataforma, prioridade.",
              },
              {
                icon: "▦",
                title: "Relatório semanal",
                body: "Resumo executivo, comparativo por engine e destaque de keywords. Em markdown, legível no e-mail.",
              },
              {
                icon: "◈",
                title: "Histórico de evolução",
                body: "Acompanhe a curva do GEO Score e correlacione com suas ações de conteúdo.",
              },
            ].map((f, i) => (
              <FadeIn key={f.title} delay={i * 60}>
                <div className="bg-white border border-ink/10 rounded-xl p-6 h-full hover:border-signal/25 hover:shadow-sm transition-all">
                  <span className="font-mono text-xl text-signal/60 block mb-4">{f.icon}</span>
                  <h3 className="font-mono text-sm font-semibold text-ink mb-2">{f.title}</h3>
                  <p className="font-mono text-xs text-ink/45 leading-relaxed">{f.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="precos" className="max-w-6xl mx-auto px-6 py-28">
        <FadeIn>
          <p className="font-mono text-[10px] uppercase tracking-widest text-signal mb-5">Preços</p>
          <h2 className="font-display font-black text-4xl text-ink mb-3 leading-tight">
            Simples. Previsível. Em BRL.
          </h2>
          <p className="font-mono text-sm text-ink/40 mb-16">
            Cartão ou Pix. Sem contrato de fidelidade. Cancele quando quiser.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Starter",
              price: "149",
              desc: "Para PMEs que querem começar a monitorar.",
              features: [
                "1 marca monitorada",
                "10 keywords",
                "ChatGPT + Gemini",
                "Monitoramento semanal",
                "Relatório semanal por e-mail",
                "Plano de ação por IA",
              ],
              cta: "Começar agora",
              highlight: false,
            },
            {
              name: "Pro",
              price: "399",
              desc: "Para empresas que querem monitorar de perto.",
              features: [
                "3 marcas monitoradas",
                "30 keywords",
                "ChatGPT + Gemini",
                "Monitoramento diário",
                "Alertas de queda de score",
                "Plano de ação por IA",
              ],
              cta: "Escolher Pro",
              highlight: true,
            },
            {
              name: "Agency",
              price: "799",
              desc: "Para agências que vendem GEO para clientes.",
              features: [
                "Marcas ilimitadas",
                "Keywords ilimitadas",
                "Monitoramento diário",
                "Relatório white-label",
                "PDF com sua identidade",
                "Plano de ação por IA",
              ],
              cta: "Falar com vendas",
              highlight: false,
            },
          ].map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 80}>
              <div
                className={`rounded-2xl p-8 h-full flex flex-col ${
                  plan.highlight
                    ? "bg-ink text-white border-2 border-signal"
                    : "bg-white border border-ink/10"
                }`}
              >
                <p
                  className={`font-mono text-[10px] uppercase tracking-widest mb-4 font-semibold ${
                    plan.highlight ? "text-signal" : "text-ink/35"
                  }`}
                >
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-0.5 mb-1">
                  <span className={`font-mono text-xs ${plan.highlight ? "text-white/40" : "text-ink/35"}`}>
                    R$
                  </span>
                  <span
                    className={`font-display font-black text-5xl leading-none ${
                      plan.highlight ? "text-white" : "text-ink"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span className={`font-mono text-xs ml-1 ${plan.highlight ? "text-white/40" : "text-ink/35"}`}>
                    /mês
                  </span>
                </div>
                <p
                  className={`font-mono text-xs mt-3 mb-8 leading-relaxed ${
                    plan.highlight ? "text-white/50" : "text-ink/45"
                  }`}
                >
                  {plan.desc}
                </p>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 text-xs font-bold leading-none ${
                          plan.highlight ? "text-signal" : "text-confirm"
                        }`}
                      >
                        ✓
                      </span>
                      <span
                        className={`font-mono text-xs leading-relaxed ${
                          plan.highlight ? "text-white/70" : "text-ink/60"
                        }`}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signup"
                  className={`block text-center font-mono text-sm font-semibold py-3.5 rounded-xl transition-colors ${
                    plan.highlight
                      ? "bg-signal text-white hover:bg-signal/90"
                      : "border border-ink/15 text-ink hover:bg-ink/5"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-white border-y border-ink/8">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <FadeIn>
            <p className="font-mono text-[10px] uppercase tracking-widest text-signal mb-5">Resultados</p>
            <h2 className="font-display font-black text-4xl text-ink mb-14 max-w-lg leading-tight">
              O que nossos clientes dizem.
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "Em 3 semanas publicando conteúdo baseado no plano da Velo, meu score no ChatGPT subiu de 28 para 61. Agora apareço antes do concorrente.",
                author: "Dr. Rafael Lima",
                role: "Advogado trabalhista · São Paulo",
                tag: "+33 pts em 3 semanas",
              },
              {
                quote:
                  "A Velo virou um relatório que mando para todos os clientes da agência. Eles finalmente entendem o valor do GEO — com dados, não com promessa.",
                author: "Marina Souza",
                role: "Diretora · Agência Conteúdo+",
                tag: "7 clientes ativos",
              },
              {
                quote:
                  "Descobri que minha clínica não aparecia em nenhuma resposta do Gemini. Dois meses depois, estou em 2ª posição para 'implante dentário Campinas'.",
                author: "Dra. Patricia Neves",
                role: "Clínica odontológica · Campinas",
                tag: "2ª posição no Gemini",
              },
            ].map((t, i) => (
              <FadeIn key={t.author} delay={i * 70}>
                <div className="border border-ink/8 rounded-2xl p-7 h-full flex flex-col">
                  <span className="font-mono text-[10px] bg-signal/8 text-signal border border-signal/15 px-2.5 py-1 rounded-full inline-block mb-5 font-medium self-start">
                    {t.tag}
                  </span>
                  <p className="font-mono text-sm text-ink/60 leading-relaxed flex-1 mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <p className="font-mono text-xs font-semibold text-ink">{t.author}</p>
                    <p className="font-mono text-[10px] text-ink/35 mt-0.5">{t.role}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-signal">
        <div className="max-w-6xl mx-auto px-6 py-28 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-6">
            Comece hoje
          </p>
          <h2 className="font-display font-black text-5xl lg:text-6xl text-white mb-6 leading-tight tracking-tight">
            Descubra agora o que<br />
            as IAs falam sobre você.
          </h2>
          <p className="font-mono text-sm text-white/60 mb-10 max-w-md mx-auto leading-relaxed">
            Sem cartão de crédito. Resultado em menos de 24 horas.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-white text-signal font-mono text-sm font-bold px-8 py-4 rounded-xl hover:bg-bone transition-colors shadow-2xl shadow-ink/20"
          >
            Começar grátis
            <span className="text-base">→</span>
          </Link>
          <p className="mt-5 font-mono text-xs text-white/30">
            7 dias grátis · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-ink/8 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="font-display font-black text-lg text-ink">
              Vel<span className="text-signal">o</span>
            </span>
            <p className="font-mono text-[10px] text-ink/25 mt-1">
              Monitore sua presença nas IAs em tempo real.
            </p>
          </div>
          <div className="flex flex-wrap gap-6">
            {[
              ["#problema", "Problema"],
              ["#como-funciona", "Como funciona"],
              ["#precos", "Preços"],
              ["/auth/login", "Entrar"],
              ["/auth/signup", "Criar conta"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="font-mono text-[10px] uppercase tracking-wider text-ink/30 hover:text-ink transition-colors">
                {label}
              </a>
            ))}
          </div>
          <p className="font-mono text-[10px] text-ink/15">© 2025 Velo</p>
        </div>
      </footer>
    </div>
  );
}
