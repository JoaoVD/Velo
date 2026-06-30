"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  TrendingUp,
  Bell,
  Target,
  Activity,
  AlertTriangle,
  Menu,
  X,
  ChevronRight,
  BarChart3,
  Shield,
  Zap,
  FileText,
} from "lucide-react";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.08 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: "opacity 0.65s ease, transform 0.65s ease",
      }}
    >
      {children}
    </div>
  );
}

/* SVG circular progress for GEO Score */
function ScoreRing({ score, size = 92 }: { score: number; size?: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 92 92"
        style={{ position: "absolute", transform: "rotate(-90deg)" }}
      >
        <circle cx="46" cy="46" r={r} fill="none" stroke="#e2e8f0" strokeWidth="7" />
        <circle
          cx="46"
          cy="46"
          r={r}
          fill="none"
          stroke="#10b981"
          strokeWidth="7"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="relative z-10 font-display font-black text-2xl text-slate-900 leading-none">
        {score}
      </span>
    </div>
  );
}

/* Simple horizontal progress bar */
function Bar({
  value,
  color = "bg-emerald-400",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */

const engines = [
  {
    name: "ChatGPT",
    status: "Menção Positiva",
    score: 85,
    chip: "text-emerald-700 bg-emerald-50",
    bar: "bg-emerald-400",
  },
  {
    name: "Perplexity",
    status: "Menção Neutra",
    score: 72,
    chip: "text-amber-700 bg-amber-50",
    bar: "bg-amber-400",
  },
  {
    name: "Gemini",
    status: "Não mencionado",
    score: 38,
    chip: "text-slate-500 bg-slate-100",
    bar: "bg-slate-300",
  },
  {
    name: "Claude",
    status: "Menção Positiva",
    score: 79,
    chip: "text-emerald-700 bg-emerald-50",
    bar: "bg-emerald-400",
  },
];

const actionPlan = [
  { text: "Adicionar schema FAQ na página principal", done: true },
  { text: "Publicar artigo sobre procedimentos mais buscados", done: true },
  { text: 'Otimizar seção "Sobre" para menções no Gemini', done: false },
];

const plans = [
  {
    name: "Starter",
    monthly: 149,
    annual: 119,
    tagline: "Ideal para profissionais autônomos e consultórios locais.",
    highlight: false,
    badge: null,
    cta: "Começar grátis",
    features: [
      "1 marca monitorada",
      "Até 10 keywords",
      "ChatGPT + Gemini",
      "Monitoramento semanal",
      "GEO Score consolidado",
      "Plano de ação mensal",
      "Relatório por e-mail",
    ],
  },
  {
    name: "Pro",
    monthly: 399,
    annual: 319,
    tagline:
      "Ideal para empresas de serviços em expansão e clínicas com múltiplos especialistas.",
    highlight: true,
    badge: "Mais escolhido",
    cta: "Começar grátis",
    features: [
      "3 marcas monitoradas",
      "Até 30 keywords",
      "ChatGPT + Gemini + Perplexity",
      "Monitoramento diário",
      "Benchmark competitivo",
      "Alertas proativos",
      "Plano de ação semanal",
      "Relatório completo em PDF",
    ],
  },
  {
    name: "Agency",
    monthly: 799,
    annual: 639,
    tagline:
      "Focado em agências. Relatórios White-Label, PDF customizados para clientes e múltiplos acessos.",
    highlight: false,
    badge: null,
    cta: "Falar com vendas",
    features: [
      "Marcas ilimitadas",
      "Keywords ilimitadas",
      "Todos os engines",
      "Entrega White-Label",
      "PDF com identidade do cliente",
      "Múltiplos acessos por workspace",
      "Suporte prioritário",
      "API de integração",
    ],
  },
];

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */

export default function LandingPage() {
  const [annual, setAnnual] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased overflow-x-hidden">

      {/* ══════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-1">
            <span className="font-display font-black text-[1.6rem] tracking-tight text-slate-900 leading-none">
              Velo
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mb-0.5 ml-0.5" />
          </div>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-10">
            {[
              ["#problema", "Problema"],
              ["#como-funciona", "Como funciona"],
              ["#precos", "Preços"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="font-mono text-[11px] uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              href="/auth/login"
              className="font-mono text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-1.5 bg-teal-600 text-white font-mono text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors"
            >
              Começar grátis
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-slate-600 p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-6 space-y-4">
            {[
              ["#problema", "Problema"],
              ["#como-funciona", "Como funciona"],
              ["#precos", "Preços"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="block font-mono text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                {label}
              </a>
            ))}
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <Link href="/auth/login" className="text-center font-mono text-sm text-slate-600">
                Entrar
              </Link>
              <Link
                href="/auth/signup"
                className="bg-teal-600 text-white text-center font-mono text-sm font-semibold py-3 rounded-xl"
              >
                Começar grátis
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="pt-36 pb-28 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">

          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-full px-4 py-1.5 mb-10">
              <Activity size={12} className="text-teal-600" />
              <span className="font-mono text-xs text-teal-700 font-medium">
                GEO Monitoring · ChatGPT, Gemini, Perplexity, Claude
              </span>
            </div>

            <h1 className="font-display font-black text-[3.2rem] lg:text-[3.8rem] leading-[1.04] tracking-tight text-slate-900 mb-8">
              O que as IAs falam<br />
              sobre você quando<br />
              <em className="text-teal-600 not-italic">ninguém</em> está<br />
              olhando
            </h1>

            <p className="font-mono text-sm text-slate-500 leading-[1.95] max-w-[440px] mb-10">
              O Velo monitora continuamente o que ChatGPT, Gemini, Perplexity e Claude
              dizem sobre a sua marca — e consolida tudo em um único{" "}
              <strong className="text-slate-800 font-semibold">GEO Score</strong>{" "}
              acionável com plano de ação semanal em português.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 bg-teal-600 text-white font-mono text-sm font-semibold px-7 py-3.5 rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20"
              >
                Ver minha presença agora
                <ArrowRight size={15} />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 font-mono text-sm px-7 py-3.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Como funciona
              </a>
            </div>

            <p className="font-mono text-xs text-slate-400">
              Sem cartão de crédito &nbsp;·&nbsp; 7 dias grátis &nbsp;·&nbsp; Resultado em &lt;24h
            </p>
          </div>

          {/* Right — dashboard mockup */}
          <div className="relative">
            {/* Subtle glow behind card */}
            <div className="absolute -inset-6 bg-teal-50 rounded-3xl blur-2xl opacity-40 pointer-events-none" />

            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/70 overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-2 bg-slate-50 border-b border-slate-100 px-5 py-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                </div>
                <span className="font-mono text-[10px] text-slate-400 mx-auto">
                  velo.app — Clínica São Lucas
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                      GEO Score geral
                    </p>
                    <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                      Atualizado há 2 horas
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Ativo
                  </span>
                </div>

                {/* GEO Score card */}
                <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-5">
                  <ScoreRing score={78} size={92} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="font-display font-black text-4xl text-slate-900 leading-none">
                        78
                      </span>
                      <span className="font-mono text-sm text-slate-400">/100</span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-600 font-semibold">
                      <TrendingUp size={11} />
                      +4 pts esta semana
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-[10px] text-slate-400">Ranking</p>
                    <p className="font-mono text-sm font-semibold text-slate-700 mt-0.5">
                      #3 / 12
                    </p>
                    <p className="font-mono text-[10px] text-slate-400">no setor</p>
                  </div>
                </div>

                {/* Engine breakdown */}
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-3">
                    Performance por Engine
                  </p>
                  <div className="space-y-2.5">
                    {engines.map(({ name, status, score, chip, bar }) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="font-mono text-xs font-medium text-slate-600 w-20 shrink-0">
                          {name}
                        </span>
                        <div className="flex-1">
                          <Bar value={score} color={bar} />
                        </div>
                        <span
                          className={`font-mono text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${chip}`}
                        >
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action plan mini */}
                <div className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={12} className="text-teal-600" />
                    <p className="font-mono text-xs font-semibold text-slate-700">
                      Plano de Ação · Semana 27
                    </p>
                  </div>
                  <div className="space-y-2">
                    {actionPlan.map(({ text, done }) => (
                      <div key={text} className="flex items-start gap-2">
                        <div
                          className={`mt-0.5 w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border ${
                            done
                              ? "bg-teal-600 border-teal-600"
                              : "border-slate-300"
                          }`}
                        >
                          {done && <Check size={9} className="text-white" />}
                        </div>
                        <p
                          className={`font-mono text-xs leading-snug ${
                            done ? "line-through text-slate-400" : "text-slate-600"
                          }`}
                        >
                          {text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating alert chip */}
            <div className="absolute -bottom-4 -left-5 bg-white border border-red-100 rounded-2xl p-4 shadow-xl max-w-[240px] hidden lg:block">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle size={12} className="text-red-500" />
                <span className="font-mono text-[10px] font-semibold text-red-600 uppercase tracking-wide">
                  Alerta detectado
                </span>
              </div>
              <p className="font-mono text-xs text-slate-600 leading-snug">
                Gemini afirmou incorretamente que você não atende planos de saúde.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ENGINE STRIP
      ══════════════════════════════════════ */}
      <div className="border-y border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            Motores monitorados
          </span>
          {[
            { name: "ChatGPT", live: true },
            { name: "Gemini", live: true },
            { name: "Perplexity", live: false },
            { name: "Claude", live: false },
          ].map(({ name, live }) => (
            <span
              key={name}
              className={`flex items-center gap-2 font-mono text-sm ${
                live ? "text-slate-800 font-semibold" : "text-slate-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  live ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
              {name}
              {!live && (
                <span className="font-mono text-[10px] text-slate-400">(em breve)</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          PROBLEM
      ══════════════════════════════════════ */}
      <section id="problema" className="py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="max-w-3xl mb-16">
            <p className="font-mono text-[10px] uppercase tracking-widest text-teal-600 mb-6">
              O problema
            </p>
            <h2 className="font-display font-black text-5xl lg:text-[3.5rem] text-slate-900 leading-[1.06] mb-8">
              Seu cliente já pergunta<br />
              para a IA antes de ligar{" "}
              <span className="text-slate-300">para você.</span>
            </h2>
            <p className="font-mono text-sm text-slate-500 leading-[1.95]">
              ChatGPT, Gemini e Perplexity tornaram-se o novo ponto de entrada para
              decisões de compra e contratação no Brasil. Quando alguém pergunta{" "}
              <em className="not-italic font-semibold text-slate-800">
                &ldquo;qual clínica de implante dentário você recomenda em Campinas?&rdquo;
              </em>
              , as IAs respondem com nomes específicos — e a maioria das empresas não
              sabe se aparece, como aparece, ou se está sendo preterida por concorrentes.{" "}
              <strong className="text-slate-700">
                Isso é o déficit de GEO que o Velo mede e resolve.
              </strong>
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                stat: "72%",
                label: "das decisões de compra",
                desc: "começam com uma pergunta a um LLM antes da busca tradicional",
                delay: 0,
              },
              {
                stat: "91%",
                label: "das marcas brasileiras",
                desc: "nunca monitoraram como são descritas dentro das respostas de IAs",
                delay: 80,
              },
              {
                stat: "3×",
                label: "mais menções",
                desc: "para empresas que otimizam GEO vs. a média do setor",
                delay: 160,
              },
            ].map(({ stat, label, desc, delay }) => (
              <FadeIn key={stat} delay={delay}>
                <div className="border border-slate-100 rounded-2xl p-8 hover:border-teal-100 hover:shadow-sm transition-all">
                  <p className="font-display font-black text-5xl text-teal-600 mb-2 leading-none">
                    {stat}
                  </p>
                  <p className="font-mono text-xs font-semibold text-slate-800 mb-2">
                    {label}
                  </p>
                  <p className="font-mono text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURE 1 — GEO Score
          Text left · Mockup right
      ══════════════════════════════════════ */}
      <section className="py-28 px-6 bg-zinc-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          {/* Copy */}
          <FadeIn>
            <p className="font-mono text-[10px] uppercase tracking-widest text-teal-600 mb-5">
              Feature 01
            </p>
            <h2 className="font-display font-black text-4xl lg:text-5xl text-slate-900 leading-tight mb-6">
              GEO Score
              <br />
              <span className="text-slate-400">
                Um número que você<br />realmente entende
              </span>
            </h2>
            <p className="font-mono text-sm text-slate-500 leading-[1.95] mb-8">
              O GEO Score combina 4 fatores ponderados numa escala de 0 a 100 — em
              linguagem de negócio, sem jargão técnico. Acompanhe sua evolução semana a
              semana e saiba exatamente onde agir.
            </p>
            <div className="space-y-5">
              {[
                {
                  label: "Menção",
                  pct: 30,
                  desc: "Sua marca apareceu na resposta da IA?",
                },
                {
                  label: "Posição",
                  pct: 25,
                  desc: "Em qual lugar da lista ela foi citada?",
                },
                {
                  label: "Sentimento",
                  pct: 25,
                  desc: "A IA fala bem, mal ou neutralmente?",
                },
                {
                  label: "Frequência",
                  pct: 20,
                  desc: "Em quantas das consultas ela apareceu?",
                },
              ].map(({ label, pct, desc }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {label}
                    </span>
                    <span className="font-mono text-xs text-teal-600 font-bold">{pct}%</span>
                  </div>
                  <Bar value={pct * 3} color="bg-teal-500" />
                  <p className="font-mono text-[10px] text-slate-400 mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Score evolution mockup */}
          <FadeIn delay={120}>
            <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-xl shadow-slate-100">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-7">
                Evolução do GEO Score · últimas 8 semanas
              </p>

              {/* Bar chart */}
              <div className="flex items-end gap-2.5 mb-6 h-36">
                {[42, 48, 51, 55, 61, 67, 72, 78].map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="font-mono text-[9px] text-slate-400">{v}</span>
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${(v / 100) * 100}px`,
                        background: i === 7 ? "#0d9488" : "#e2e8f0",
                      }}
                    />
                    <span className="font-mono text-[8px] text-slate-300">S{i + 20}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                <div>
                  <p className="font-mono text-[10px] text-slate-400">Score atual</p>
                  <p className="font-display font-black text-4xl text-slate-900 leading-none mt-1">
                    78
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] text-slate-400">Evolução (8 sem.)</p>
                  <p className="font-display font-black text-4xl text-emerald-500 leading-none mt-1">
                    +36
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURE 2 — Benchmark Competitivo
          Mockup left · Text right
      ══════════════════════════════════════ */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          {/* Mockup */}
          <FadeIn className="order-2 lg:order-1">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-100">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-5">
                Share of Voice · Implantes Campinas · Jun 2025
              </p>
              <div className="space-y-3">
                {[
                  { name: "OdontoCampinas", score: 85, you: false },
                  { name: "Clínica São Lucas", score: 78, you: true },
                  { name: "Sorriso Perfeito", score: 71, you: false },
                  { name: "Dr. Paulo Mendes", score: 52, you: false },
                  { name: "DentalPro", score: 34, you: false },
                ].map(({ name, score, you }, i) => (
                  <div
                    key={name}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      you ? "bg-teal-50 border border-teal-100" : ""
                    }`}
                  >
                    <span
                      className={`font-mono text-[10px] font-medium shrink-0 w-4 ${
                        you ? "text-teal-600" : "text-slate-400"
                      }`}
                    >
                      #{i + 1}
                    </span>
                    <span
                      className={`font-mono text-xs flex-1 min-w-0 flex items-center gap-2 ${
                        you ? "font-semibold text-teal-700" : "text-slate-500"
                      }`}
                    >
                      <span className="truncate">{name}</span>
                      {you && (
                        <span className="text-[9px] bg-teal-600 text-white px-1.5 py-0.5 rounded font-normal shrink-0">
                          você
                        </span>
                      )}
                    </span>
                    <div className="w-24 shrink-0">
                      <Bar
                        value={score}
                        color={you ? "bg-teal-500" : "bg-slate-200"}
                      />
                    </div>
                    <span
                      className={`font-mono text-xs font-bold w-7 text-right shrink-0 ${
                        you ? "text-teal-600" : "text-slate-400"
                      }`}
                    >
                      {score}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                <AlertTriangle size={12} className="text-amber-500" />
                <p className="font-mono text-xs text-amber-700">
                  OdontoCampinas subiu 3 posições na última semana.
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Copy */}
          <FadeIn delay={120} className="order-1 lg:order-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-teal-600 mb-5">
              Feature 02
            </p>
            <h2 className="font-display font-black text-4xl lg:text-5xl text-slate-900 leading-tight mb-6">
              Benchmark
              <br />
              Competitivo
              <br />
              <span className="text-slate-400">
                Onde você está em<br />relação aos rivais
              </span>
            </h2>
            <p className="font-mono text-sm text-slate-500 leading-[1.95] mb-7">
              Acompanhe o share of voice da sua marca nas IAs comparado diretamente aos
              seus concorrentes — por keyword, por engine e por semana. Saiba quem está
              dominando as respostas e o que eles fazem diferente.
            </p>
            <ul className="space-y-3.5">
              {[
                "Ranking de concorrentes por GEO Score",
                "Share of voice por keyword estratégica",
                "Análise de gaps por engine",
                "Alertas quando um rival superar você",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check size={14} className="text-teal-600 mt-0.5 shrink-0" />
                  <span className="font-mono text-sm text-slate-600">{item}</span>
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURE 3 — Plano de Ação
          Text left · Mockup right
      ══════════════════════════════════════ */}
      <section className="py-28 px-6 bg-zinc-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          {/* Copy */}
          <FadeIn>
            <p className="font-mono text-[10px] uppercase tracking-widest text-teal-600 mb-5">
              Feature 03
            </p>
            <h2 className="font-display font-black text-4xl lg:text-5xl text-slate-900 leading-tight mb-6">
              Plano de Ação
              <br />
              gerado por IA
              <br />
              <span className="text-slate-400">
                Sem jargão.
                <br />
                Só o que fazer.
              </span>
            </h2>
            <p className="font-mono text-sm text-slate-500 leading-[1.95] mb-7">
              Toda semana o Velo entrega um plano de ação priorizado com base no seu GEO
              Score — ações concretas de conteúdo, SEO técnico e presença digital que os
              crawlers de IA usam para decidir quem recomendar.
            </p>
            <ul className="space-y-3.5">
              {[
                "Ações priorizadas por impacto estimado no GEO Score",
                "Recomendações de tipo de conteúdo e plataforma",
                "Sugestões de FAQ, schema markup e E-E-A-T",
                "Em português claro, direto ao ponto",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check size={14} className="text-teal-600 mt-0.5 shrink-0" />
                  <span className="font-mono text-sm text-slate-600">{item}</span>
                </li>
              ))}
            </ul>
          </FadeIn>

          {/* Mockup */}
          <FadeIn delay={120}>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Target size={13} className="text-teal-600" />
                  <p className="font-mono text-xs font-semibold text-slate-700">
                    Plano de Ação — Semana 27
                  </p>
                </div>
                <span className="font-mono text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                  3 pendentes
                </span>
              </div>
              <div className="p-5 space-y-2.5">
                {[
                  {
                    priority: "Alta",
                    text: "Publicar artigo: '5 dúvidas frequentes sobre implante dentário'",
                    done: false,
                    impact: "+8 pts",
                    priorityColor: "text-red-500",
                  },
                  {
                    priority: "Alta",
                    text: "Adicionar FAQ com schema JSON-LD na página de serviços",
                    done: false,
                    impact: "+6 pts",
                    priorityColor: "text-red-500",
                  },
                  {
                    priority: "Média",
                    text: "Atualizar perfil Google Business com palavras-chave de IA",
                    done: false,
                    impact: "+4 pts",
                    priorityColor: "text-amber-500",
                  },
                  {
                    priority: "Feito",
                    text: "Atualizar página 'Sobre' com histórico e credenciais",
                    done: true,
                    impact: "+5 pts",
                    priorityColor: "text-slate-400",
                  },
                  {
                    priority: "Feito",
                    text: "Publicar depoimentos reais de pacientes com nome e cidade",
                    done: true,
                    impact: "+7 pts",
                    priorityColor: "text-slate-400",
                  },
                ].map(({ priority, text, done, impact, priorityColor }) => (
                  <div
                    key={text}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      done ? "opacity-50" : "bg-slate-50"
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                        done ? "bg-teal-600 border-teal-600" : "border-slate-300"
                      }`}
                    >
                      {done && <Check size={10} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`font-mono text-[10px] font-medium ${priorityColor}`}>
                        {priority === "Feito" ? "Concluído" : `Prioridade ${priority}`}
                      </span>
                      <p
                        className={`font-mono text-xs leading-snug mt-0.5 ${
                          done ? "line-through text-slate-400" : "text-slate-700"
                        }`}
                      >
                        {text}
                      </p>
                    </div>
                    <span
                      className={`font-mono text-xs font-bold shrink-0 ${
                        done ? "text-emerald-500" : "text-teal-600"
                      }`}
                    >
                      {impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURE 4 — Alertas Proativos
          Mockup left · Text right
      ══════════════════════════════════════ */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          {/* Mockup */}
          <FadeIn className="order-2 lg:order-1 space-y-3">
            {[
              {
                type: "critical",
                icon: <AlertTriangle size={14} className="text-red-600" />,
                iconBg: "bg-red-100",
                border: "border-red-100 bg-red-50",
                titleColor: "text-red-700",
                chipColor: "bg-red-100 text-red-600",
                engine: "Gemini",
                title: "Distorção factual detectada",
                body: "O Gemini afirmou incorretamente que sua clínica não aceita convênios odontológicos.",
                time: "há 4 horas",
              },
              {
                type: "warning",
                icon: <TrendingUp size={14} className="text-amber-600" />,
                iconBg: "bg-amber-100",
                border: "border-amber-100 bg-amber-50",
                titleColor: "text-amber-700",
                chipColor: "bg-amber-100 text-amber-600",
                engine: "ChatGPT",
                title: "Concorrente subiu 12 posições",
                body: "OdontoCampinas passou sua clínica em 'implante dentário Campinas' no ChatGPT.",
                time: "há 1 dia",
              },
              {
                type: "success",
                icon: <Bell size={14} className="text-emerald-600" />,
                iconBg: "bg-emerald-100",
                border: "border-emerald-100 bg-emerald-50",
                titleColor: "text-emerald-700",
                chipColor: "bg-emerald-100 text-emerald-600",
                engine: "Perplexity",
                title: "Nova menção positiva",
                body: "Sua marca foi citada em 1ª posição para 'melhor clínica odontológica Campinas'.",
                time: "há 2 dias",
              },
            ].map(({ icon, iconBg, border, titleColor, chipColor, engine, title, body, time }) => (
              <div key={title} className={`border rounded-xl p-5 ${border}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`font-mono text-xs font-semibold ${titleColor}`}>
                        {title}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        {time}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-slate-600 leading-snug mb-2.5">
                      {body}
                    </p>
                    <span
                      className={`font-mono text-[10px] font-medium px-2 py-0.5 rounded-full ${chipColor}`}
                    >
                      {engine}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </FadeIn>

          {/* Copy */}
          <FadeIn delay={120} className="order-1 lg:order-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-teal-600 mb-5">
              Feature 04
            </p>
            <h2 className="font-display font-black text-4xl lg:text-5xl text-slate-900 leading-tight mb-6">
              Alertas Proativos
              <br />
              <span className="text-slate-400">
                Antes que o problema
                <br />
                custe um cliente
              </span>
            </h2>
            <p className="font-mono text-sm text-slate-500 leading-[1.95] mb-7">
              Receba notificações imediatas quando uma menção crítica, uma distorção
              factual ou uma queda de ranking for detectada nas respostas de IA — para
              clínicas, escritórios e empresas onde reputação é o ativo mais importante.
            </p>
            <ul className="space-y-3.5">
              {[
                "Alertas de distorção factual em tempo real",
                "Notificação quando concorrente ultrapassar você",
                "Detecção de sentimento negativo inesperado",
                "Canais: e-mail, Slack e webhook",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check size={14} className="text-teal-600 mt-0.5 shrink-0" />
                  <span className="font-mono text-sm text-slate-600">{item}</span>
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section id="como-funciona" className="py-28 px-6 bg-zinc-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="mb-20">
            <p className="font-mono text-[10px] uppercase tracking-widest text-teal-600 mb-6">
              Como funciona
            </p>
            <h2 className="font-display font-black text-5xl lg:text-[3.5rem] text-slate-900 leading-[1.06] max-w-lg">
              Três etapas.{" "}
              <span className="text-slate-400">
                Um relatório que você realmente usa.
              </span>
            </h2>
          </FadeIn>

          <div className="space-y-0 divide-y divide-slate-200">
            {[
              {
                n: "01",
                title: "Cadastre sua marca",
                body: "Informe o nome da sua empresa, site e até 30 keywords estratégicas. Não é necessário código, integração ou acesso técnico. O setup completo leva menos de 5 minutos.",
                delay: 0,
              },
              {
                n: "02",
                title: "A Velo sonda as IAs",
                body: "Disparamos queries reais — simulando a jornada de consumidores reais — para ChatGPT, Gemini, Perplexity e Claude. Analisamos cada resposta com IA para detectar menções, posicionamento, sentimento e frequência.",
                delay: 80,
              },
              {
                n: "03",
                title: "Você recebe o GEO Score + plano de ação",
                body: "Em menos de 24h você recebe seu primeiro relatório com o GEO Score consolidado, análise por engine, benchmark competitivo e um plano de ação semanal priorizado — em português, sem jargão.",
                delay: 160,
              },
            ].map(({ n, title, body, delay }) => (
              <FadeIn key={n} delay={delay}>
                <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-start py-12">
                  <div className="lg:col-span-2">
                    <span className="font-display font-black text-7xl lg:text-8xl text-teal-600/15 leading-none select-none">
                      {n}
                    </span>
                  </div>
                  <div className="lg:col-span-4">
                    <h3 className="font-display font-black text-3xl text-slate-900 leading-tight">
                      {title}
                    </h3>
                  </div>
                  <div className="lg:col-span-6">
                    <p className="font-mono text-sm text-slate-500 leading-[1.95]">{body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          PRICING
      ══════════════════════════════════════ */}
      <section id="precos" className="py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <p className="font-mono text-[10px] uppercase tracking-widest text-teal-600 mb-6">
              Preços
            </p>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-16">
              <h2 className="font-display font-black text-5xl text-slate-900 leading-tight">
                Simples e previsível.
                <br />
                <span className="text-slate-400">Cancele quando quiser.</span>
              </h2>

              {/* Toggle */}
              <div className="flex items-center gap-3 pb-1 shrink-0">
                <span
                  className={`font-mono text-sm transition-colors ${
                    !annual ? "text-slate-900 font-semibold" : "text-slate-400"
                  }`}
                >
                  Mensal
                </span>
                <button
                  onClick={() => setAnnual(!annual)}
                  aria-label="Toggle anual/mensal"
                  className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    annual ? "bg-teal-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      annual ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
                <span
                  className={`font-mono text-sm transition-colors flex items-center gap-2 ${
                    annual ? "text-slate-900 font-semibold" : "text-slate-400"
                  }`}
                >
                  Anual
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    −20%
                  </span>
                </span>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(({ name, monthly, annual: annualPrice, tagline, highlight, badge, cta, features }, i) => {
              const price = annual ? annualPrice : monthly;
              const savings = (monthly - annualPrice) * 12;
              return (
                <FadeIn key={name} delay={i * 80}>
                  <div
                    className={`relative flex flex-col rounded-2xl p-8 h-full transition-shadow ${
                      highlight
                        ? "border-2 border-teal-500 bg-white shadow-2xl shadow-teal-100"
                        : "border border-slate-200 bg-white hover:shadow-md"
                    }`}
                  >
                    {/* Badge */}
                    {badge && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="bg-teal-600 text-white font-mono text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg shadow-teal-600/30">
                          {badge}
                        </span>
                      </div>
                    )}

                    <p
                      className={`font-mono text-[10px] uppercase tracking-widest font-semibold mb-5 ${
                        highlight ? "text-teal-600" : "text-slate-400"
                      }`}
                    >
                      {name}
                    </p>

                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="font-mono text-sm text-slate-400">R$</span>
                      <span className="font-display font-black text-5xl text-slate-900 leading-none">
                        {price}
                      </span>
                      <span className="font-mono text-sm text-slate-400">/mês</span>
                    </div>

                    {annual && (
                      <p className="font-mono text-xs text-emerald-600 mt-1 mb-1">
                        Economia de R${savings}/ano na cobrança anual
                      </p>
                    )}

                    <p className="font-mono text-xs text-slate-500 leading-relaxed mt-3 mb-8">
                      {tagline}
                    </p>

                    <ul className="space-y-2.5 flex-1 mb-8">
                      {features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <Check
                            size={13}
                            className={`mt-0.5 shrink-0 ${
                              highlight ? "text-teal-600" : "text-emerald-500"
                            }`}
                          />
                          <span className="font-mono text-xs text-slate-600">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/auth/signup"
                      className={`block text-center font-mono text-sm font-semibold py-3.5 rounded-xl transition-colors ${
                        highlight
                          ? "bg-teal-600 text-white hover:bg-teal-700"
                          : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {cta}
                    </Link>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          <FadeIn delay={200}>
            <p className="font-mono text-xs text-slate-400 text-center mt-10">
              Cartão ou Pix &nbsp;·&nbsp; Sem contrato de fidelidade &nbsp;·&nbsp; 7 dias
              grátis em todos os planos
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════ */}
      <section className="py-28 px-6 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-teal-400 mb-8">
            Comece hoje
          </p>
          <h2 className="font-display font-black text-5xl lg:text-6xl text-white leading-[1.05] mb-8">
            Descubra agora o que<br />
            as IAs falam sobre você.
          </h2>
          <p className="font-mono text-sm text-slate-400 mb-12 max-w-md mx-auto leading-relaxed">
            Sem cartão de crédito. Resultado em menos de 24 horas. 7 dias de acesso
            completo, grátis.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-teal-600 text-white font-mono text-sm font-bold px-10 py-4 rounded-xl hover:bg-teal-500 transition-colors shadow-2xl shadow-teal-900/40"
          >
            Ver minha presença agora
            <ArrowRight size={16} />
          </Link>
          <p className="mt-6 font-mono text-xs text-slate-600">
            7 dias grátis &nbsp;·&nbsp; Sem cartão &nbsp;·&nbsp; Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-1 mb-4">
                <span className="font-display font-black text-2xl text-slate-900 leading-none">
                  Velo
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mb-0.5 ml-0.5" />
              </div>
              <p className="font-mono text-xs text-slate-400 leading-relaxed mb-5">
                Monitore sua presença nas IAs. GEO Score, benchmark competitivo e plano
                de ação — em português.
              </p>
              <p className="font-mono text-[10px] text-slate-300">
                © 2025 Velo Tecnologia LTDA
              </p>
            </div>

            {/* Produto */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-5">
                Produto
              </p>
              <ul className="space-y-3">
                {["Problema", "Como funciona", "Preços", "Changelog"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="font-mono text-xs text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-5">
                Empresa
              </p>
              <ul className="space-y-3">
                {["Sobre", "Blog", "Imprensa", "Contato"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="font-mono text-xs text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-5">
                Legal
              </p>
              <ul className="space-y-3">
                {["Privacidade", "Termos de uso", "LGPD", "Cookies"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="font-mono text-xs text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
