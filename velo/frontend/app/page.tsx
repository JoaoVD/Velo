"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, Check } from "lucide-react";

/* ————————————————————————————————————————————————
   Motion primitives
———————————————————————————————————————————————— */

function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Número que conta de `from` até `to` quando entra na viewport. */
function Counter({
  from = 0,
  to,
  suffix = "",
  duration = 1400,
  className = "",
}: {
  from?: number;
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.6);
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!inView) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, from, to, duration]);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
}

/** Barra horizontal que preenche até `pct`% quando visível. */
function FillBar({
  pct,
  color = "bg-ink",
  delay = 0,
  className = "",
}: {
  pct: number;
  color?: string;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.5);
  return (
    <div ref={ref} className={`h-1.5 bg-ink/10 overflow-hidden ${className}`}>
      <div
        className={`h-full ${color}`}
        style={{
          width: inView ? `${pct}%` : "0%",
          transition: `width 1.1s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        }}
      />
    </div>
  );
}

/* ————————————————————————————————————————————————
   Hero: simulador de resposta de IA
   Mostra a dor (marca ausente) e a virada (marca no topo)
———————————————————————————————————————————————— */

const SIM_QUESTION = "qual a melhor clínica odontológica em Campinas?";

const SIM_WITHOUT = [
  { pos: 1, name: "OdontoPrime", you: false },
  { pos: 2, name: "Clínica Sorriso Real", you: false },
  { pos: 3, name: "DentalCare Campinas", you: false },
];

const SIM_WITH = [
  { pos: 1, name: "Clínica São Lucas", you: true },
  { pos: 2, name: "OdontoPrime", you: false },
  { pos: 3, name: "Clínica Sorriso Real", you: false },
];

type SimPhase =
  | "typing"
  | "answering-without"
  | "stamp"
  | "hold-without"
  | "answering-with"
  | "hold-with";

function HeroSimulator() {
  const [phase, setPhase] = useState<SimPhase>("typing");
  const [typed, setTyped] = useState("");
  const [visibleRows, setVisibleRows] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const schedule = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === "typing") {
      setTyped("");
      setVisibleRows(0);
      let i = 0;
      const interval = setInterval(() => {
        i += 1;
        setTyped(SIM_QUESTION.slice(0, i));
        if (i >= SIM_QUESTION.length) {
          clearInterval(interval);
          schedule(() => setPhase("answering-without"), 500);
        }
      }, 38);
      return () => clearInterval(interval);
    }
    if (phase === "answering-without" || phase === "answering-with") {
      setVisibleRows(0);
      let row = 0;
      const interval = setInterval(() => {
        row += 1;
        setVisibleRows(row);
        if (row >= 3) {
          clearInterval(interval);
          schedule(
            () => setPhase(phase === "answering-without" ? "stamp" : "hold-with"),
            450
          );
        }
      }, 380);
      return () => clearInterval(interval);
    }
    if (phase === "stamp") {
      schedule(() => setPhase("hold-without"), 2200);
    }
    if (phase === "hold-without") {
      schedule(() => setPhase("answering-with"), 1400);
    }
    if (phase === "hold-with") {
      schedule(() => setPhase("typing"), 4200);
    }
  }, [phase, schedule]);

  const withVelo = phase === "answering-with" || phase === "hold-with";
  const rows = withVelo ? SIM_WITH : SIM_WITHOUT;
  const answering = phase !== "typing";

  return (
    <div className="relative">
      {/* moldura tipo relatório */}
      <div className="border-2 border-ink bg-white">
        {/* barra do terminal */}
        <div className="flex items-center justify-between border-b-2 border-ink px-4 py-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">
            Resposta do ChatGPT
          </span>
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 border ${
              withVelo
                ? "border-confirm text-confirm"
                : "border-ink/30 text-ink/40"
            }`}
          >
            {withVelo ? "após 6 semanas de Velo" : "hoje"}
          </span>
        </div>

        <div className="p-5 min-h-[280px] sm:min-h-[310px]">
          {/* pergunta do consumidor */}
          <div className="mb-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40 mb-1.5">
              Pergunta real de consumidor
            </p>
            <p className="font-mono text-sm text-ink leading-relaxed">
              <span className="text-signal font-semibold">›</span> {typed}
              <span className="inline-block w-2 h-4 bg-ink align-text-bottom ml-0.5 animate-caret" />
            </p>
          </div>

          {/* resposta da IA */}
          {answering && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40 mb-2.5">
                Recomendações da IA
              </p>
              <ol className="space-y-2">
                {rows.slice(0, visibleRows).map((r) => (
                  <li
                    key={`${withVelo}-${r.pos}`}
                    className={`animate-rise flex items-center gap-3 border px-3 py-2.5 ${
                      r.you
                        ? "border-confirm bg-confirm/5"
                        : "border-ink/15 bg-bone/60"
                    }`}
                  >
                    <span
                      className={`font-display font-black text-lg leading-none w-5 ${
                        r.you ? "text-confirm" : "text-ink/30"
                      }`}
                    >
                      {r.pos}
                    </span>
                    <span
                      className={`font-mono text-sm ${
                        r.you ? "text-confirm font-semibold" : "text-ink/70"
                      }`}
                    >
                      {r.name}
                    </span>
                    {r.you && (
                      <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.15em] text-confirm border border-confirm px-1.5 py-0.5">
                        sua marca
                      </span>
                    )}
                  </li>
                ))}
              </ol>

              {/* carimbo: marca ausente */}
              {(phase === "stamp" || phase === "hold-without") && (
                <div className="mt-5 flex justify-center">
                  <span className="animate-stamp inline-block border-2 border-signal text-signal font-display font-black text-lg px-4 py-1.5 select-none">
                    Sua marca não aparece.
                  </span>
                </div>
              )}

              {/* selo de score */}
              {phase === "hold-with" && (
                <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4 animate-rise">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40">
                    GEO Score
                  </span>
                  <span className="font-display font-black text-2xl text-confirm">
                    78
                    <span className="text-sm text-ink/30 font-mono font-normal">
                      /100
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* sombra dura editorial */}
      <div className="absolute inset-0 border-2 border-ink bg-ink -z-10 translate-x-2 translate-y-2" />
    </div>
  );
}

/* ————————————————————————————————————————————————
   Dados da página
———————————————————————————————————————————————— */

const NAV_LINKS = [
  { href: "#problema", label: "O problema" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#geo-score", label: "GEO Score" },
  { href: "#precos", label: "Preços" },
  { href: "#teste-gratis", label: "Teste grátis" },
];

/* ————————————————————————————————————————————————
   Checker gratuito (sem login)
———————————————————————————————————————————————— */

interface CheckResult {
  mentioned: boolean;
  position: number | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  snippet: string;
}

const SENTIMENT_LABELS: Record<string, string> = {
  positive: "descrita positivamente",
  neutral: "citada de forma neutra",
  negative: "descrita com críticas",
};

function FreeChecker() {
  const [brandName, setBrandName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/public/ai-check`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand_name: brandName, keyword }),
          signal: AbortSignal.timeout(60000),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.detail || "Não foi possível verificar agora. Tente novamente."
        );
      }
      setResult(await res.json());
    } catch (err) {
      setError(
        err instanceof Error && err.message && !err.message.includes("abort")
          ? err.message
          : "Não foi possível verificar agora. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-ink/20 bg-bone">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="fc-brand" className="block font-mono text-[11px] uppercase tracking-[0.15em] text-ink/50 mb-2">
              Sua marca
            </label>
            <input
              id="fc-brand"
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Clínica Sorriso Real"
              className="w-full bg-transparent border border-ink/25 px-4 py-3 font-mono text-sm placeholder:text-ink/30 focus:outline-none focus:border-signal"
            />
          </div>
          <div>
            <label htmlFor="fc-keyword" className="block font-mono text-[11px] uppercase tracking-[0.15em] text-ink/50 mb-2">
              O que seu cliente pergunta
            </label>
            <input
              id="fc-keyword"
              type="text"
              required
              minLength={3}
              maxLength={120}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="melhor dentista em Campinas"
              className="w-full bg-transparent border border-ink/25 px-4 py-3 font-mono text-sm placeholder:text-ink/30 focus:outline-none focus:border-signal"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-signal text-bone font-mono text-sm font-semibold px-8 py-3.5 hover:bg-ink transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Perguntando ao ChatGPT..." : "Verificar grátis"}
          {!loading && <ArrowRight size={16} />}
        </button>
        <p className="font-mono text-[10px] text-ink/40 mt-3">
          3 verificações gratuitas por dia · Sem cadastro
        </p>
      </form>

      {error && (
        <div className="border-t border-ink/20 px-6 sm:px-8 py-5">
          <p className="font-mono text-xs text-signal">{error}</p>
        </div>
      )}

      {result && (
        <div className="border-t border-ink/20 px-6 sm:px-8 py-6 animate-rise">
          <p
            className={`inline-block font-mono text-[11px] uppercase tracking-[0.2em] font-semibold px-3 py-1.5 border-2 mb-4 ${
              result.mentioned
                ? "border-confirm text-confirm"
                : "border-signal text-signal"
            }`}
          >
            {result.mentioned ? "✓ Marca mencionada" : "✗ Marca não mencionada"}
          </p>
          {result.mentioned && (
            <p className="font-mono text-sm text-ink/70 mb-3">
              {result.position !== null && (
                <>Aparece na <strong className="text-ink">posição {result.position}</strong></>
              )}
              {result.sentiment && SENTIMENT_LABELS[result.sentiment] && (
                <>{result.position !== null ? ", " : "Sua marca é "}{SENTIMENT_LABELS[result.sentiment]}.</>
              )}
            </p>
          )}
          <blockquote className="border-l-2 border-ink/20 pl-4 font-mono text-[13px] font-light leading-[1.7] text-ink/60 mb-5">
            &ldquo;{result.snippet}…&rdquo;
          </blockquote>
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-2 font-mono text-sm font-semibold text-signal hover:text-ink transition-colors"
          >
            {result.mentioned
              ? "Monitore isso toda semana, em 2 IAs e várias keywords"
              : "Descubra como fazer as IAs citarem sua marca"}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </div>
  );
}

const ENGINES = [
  { name: "ChatGPT", status: "monitorando" },
  { name: "Gemini", status: "monitorando" },
  { name: "Perplexity", status: "em breve" },
  { name: "Claude", status: "em breve" },
];

const SCORE_FACTORS = [
  { label: "Menção", desc: "sua marca é citada?", weight: 30 },
  { label: "Posição", desc: "em que ordem aparece?", weight: 25 },
  { label: "Sentimento", desc: "como é descrita?", weight: 25 },
  { label: "Frequência", desc: "com que constância?", weight: 20 },
];

const WEEKLY_SCORES = [42, 45, 51, 49, 58, 66, 71, 78];

const BENCHMARK = [
  { name: "OdontoPrime", score: 84, you: false },
  { name: "Clínica São Lucas", score: 78, you: true },
  { name: "Clínica Sorriso Real", score: 61, you: false },
  { name: "DentalCare Campinas", score: 44, you: false },
];

const ACTIONS = [
  {
    priority: "alta",
    text: "Publicar página de FAQ respondendo \u201cquanto custa um implante em Campinas\u201d — o ChatGPT cita fontes com respostas diretas.",
  },
  {
    priority: "alta",
    text: "Cadastrar a clínica no Google Business Profile com categoria específica — o Gemini prioriza dados estruturados locais.",
  },
  {
    priority: "média",
    text: "Conseguir 2 menções em portais regionais de saúde — frequência de citação pesa 20% do score.",
  },
];

const PLANS = [
  {
    name: "Starter",
    monthly: 149,
    highlight: false,
    features: [
      "1 marca monitorada",
      "10 keywords",
      "Scan semanal",
      "Relatório semanal por e-mail",
      "GEO Score por engine",
    ],
  },
  {
    name: "Pro",
    monthly: 399,
    highlight: true,
    features: [
      "3 marcas monitoradas",
      "30 keywords",
      "Scan diário",
      "Alertas proativos",
      "Plano de ação gerado por IA",
      "Benchmark vs. concorrentes",
    ],
  },
  {
    name: "Agency",
    monthly: 799,
    highlight: false,
    features: [
      "Marcas ilimitadas",
      "Keywords ilimitadas",
      "Scan diário",
      "White-label",
      "Relatório PDF com a marca da agência",
      "Suporte prioritário",
    ],
  },
];

const PROBLEM_STATS = [
  {
    value: 72,
    suffix: "%",
    text: "dos consumidores que usam IA confiam nas recomendações que recebem dela",
  },
  {
    value: 91,
    suffix: "%",
    text: "das marcas brasileiras não sabem como aparecem nas respostas das IAs",
  },
  {
    value: 3,
    suffix: "×",
    text: "mais menções para marcas com conteúdo otimizado para engines generativas",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Cadastre sua marca",
    text: "Nome, setor e até 10 keywords que seus clientes usariam para te encontrar. Leva menos de 4 minutos.",
  },
  {
    num: "02",
    title: "A Velo sonda as IAs",
    text: "Consultas periódicas ao ChatGPT e Gemini com perguntas reais de consumidores. Cada resposta é analisada por IA.",
  },
  {
    num: "03",
    title: "Score + plano de ação",
    text: "GEO Score por engine e por keyword, histórico de evolução e recomendações concretas de conteúdo. Primeiro resultado em até 24h.",
  },
];

/* ————————————————————————————————————————————————
   Página
———————————————————————————————————————————————— */

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [annual, setAnnual] = useState(false);

  return (
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
      {/* ————— Navbar ————— */}
      <header className="sticky top-0 z-50 bg-bone/95 backdrop-blur-sm border-b border-ink/15">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl tracking-tight">
            v<span className="text-signal">e</span>lo
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-mono text-xs uppercase tracking-[0.15em] text-ink/60 hover:text-ink transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/auth/login"
              className="font-mono text-xs uppercase tracking-[0.15em] text-ink/60 hover:text-ink px-3 py-2 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/auth/signup"
              className="font-mono text-xs uppercase tracking-[0.15em] bg-ink text-bone px-4 py-2.5 hover:bg-signal transition-colors"
            >
              Começar grátis
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {mobileOpen && (
          <div className="md:hidden border-t border-ink/15 bg-bone px-6 py-4 space-y-3">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block font-mono text-sm text-ink/70 py-1.5"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t border-ink/10 flex gap-3">
              <Link
                href="/auth/login"
                className="flex-1 text-center font-mono text-xs uppercase tracking-[0.15em] border border-ink px-4 py-2.5"
              >
                Entrar
              </Link>
              <Link
                href="/auth/signup"
                className="flex-1 text-center font-mono text-xs uppercase tracking-[0.15em] bg-ink text-bone px-4 py-2.5"
              >
                Começar
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ————— Hero ————— */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-2 gap-14 lg:gap-12 items-center">
          <div>
            <FadeIn>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-signal mb-6 flex items-center gap-2">
                <span className="inline-block w-8 h-px bg-signal" />
                GEO · Generative Engine Optimization · Brasil
              </p>
            </FadeIn>
            <FadeIn delay={100}>
              <h1 className="font-display font-black text-[2.6rem] leading-[1.05] sm:text-6xl tracking-tight text-balance mb-6">
                O que as IAs{" "}
                <em className="font-display italic text-signal">falam sobre você</em>{" "}
                quando ninguém está olhando
              </h1>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="font-mono text-sm sm:text-[15px] font-light leading-[1.8] text-ink/70 max-w-lg mb-9">
                Seus clientes já perguntam ao ChatGPT antes de contratar. A Velo
                monitora como as IAs descrevem, citam e recomendam a sua marca —
                calcula um GEO Score de 0 a 100 e entrega o plano para subir.
              </p>
            </FadeIn>
            <FadeIn delay={300}>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link
                  href="/auth/signup"
                  className="group inline-flex items-center justify-center gap-2.5 bg-signal text-bone font-mono text-sm font-semibold px-7 py-4 hover:bg-ink transition-colors"
                >
                  Ver minha presença agora
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center border border-ink/25 font-mono text-sm px-7 py-4 text-ink/70 hover:border-ink hover:text-ink transition-colors"
                >
                  Como funciona
                </a>
              </div>
            </FadeIn>
            <FadeIn delay={400}>
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink/40">
                Resultado em &lt;24h &nbsp;·&nbsp; 7 dias grátis &nbsp;·&nbsp; Sem cartão
              </p>
            </FadeIn>
          </div>

          <FadeIn delay={250}>
            <HeroSimulator />
          </FadeIn>
        </div>
      </section>

      {/* ————— Marquee de engines ————— */}
      <div className="bg-ink text-bone border-y-2 border-ink overflow-hidden py-3.5">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
              {[...ENGINES, ...ENGINES].map((e, i) => (
                <span
                  key={`${copy}-${i}`}
                  className="font-mono text-xs uppercase tracking-[0.25em] px-8 flex items-center gap-3 whitespace-nowrap"
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      e.status === "monitorando" ? "bg-confirm" : "bg-bone/30"
                    }`}
                  />
                  {e.name}
                  <span className="text-bone/40 normal-case tracking-normal">
                    {e.status}
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ————— Problema ————— */}
      <section id="problema" className="bg-ink text-bone">
        <div className="max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <FadeIn>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-signal mb-6">
              01 — O problema
            </p>
            <h2 className="font-display font-black text-3xl sm:text-5xl tracking-tight max-w-3xl mb-6 text-balance">
              Seu cliente já pergunta para a IA antes de ligar para você
            </h2>
            <p className="font-mono text-sm font-light leading-[1.8] text-bone/60 max-w-2xl mb-16">
              &ldquo;Qual advogado trabalhista em SP você recomenda?&rdquo;
              &ldquo;Melhor clínica odontológica em Campinas?&rdquo; As IAs
              respondem com nomes específicos. Se o seu não está na resposta, o do
              concorrente está.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 border-t border-bone/20">
            {PROBLEM_STATS.map((stat, i) => (
              <FadeIn key={stat.text} delay={i * 120}>
                <div
                  className={`py-10 md:py-12 pr-8 ${
                    i > 0 ? "md:pl-8 md:border-l border-bone/20" : ""
                  } border-b md:border-b-0 border-bone/20`}
                >
                  <p className="font-display font-black text-6xl sm:text-7xl text-signal mb-4">
                    <Counter to={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="font-mono text-[13px] font-light leading-[1.7] text-bone/60">
                    {stat.text}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Como funciona ————— */}
      <section id="como-funciona" className="border-b border-ink/15">
        <div className="max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <FadeIn>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-signal mb-6">
              02 — Como funciona
            </p>
            <h2 className="font-display font-black text-3xl sm:text-5xl tracking-tight max-w-3xl mb-16 text-balance">
              Monitoramento contínuo, em português, sem trabalho manual
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-px bg-ink/15 border border-ink/15">
            {STEPS.map((step, i) => (
              <FadeIn key={step.num} delay={i * 120} className="bg-bone">
                <div className="p-8 lg:p-10 h-full">
                  <p className="font-display font-black text-5xl text-ink/15 mb-6">
                    {step.num}
                  </p>
                  <h3 className="font-display font-bold text-xl mb-3">{step.title}</h3>
                  <p className="font-mono text-[13px] font-light leading-[1.7] text-ink/60">
                    {step.text}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ————— GEO Score ————— */}
      <section id="geo-score" className="border-b border-ink/15">
        <div className="max-w-6xl mx-auto px-6 py-24 lg:py-32 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <FadeIn>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-signal mb-6">
                03 — GEO Score
              </p>
              <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight mb-6 text-balance">
                Uma métrica de 0 a 100 que seu cliente entende
              </h2>
              <p className="font-mono text-sm font-light leading-[1.8] text-ink/70 mb-10 max-w-lg">
                Quatro fatores ponderados, medidos em cada engine e em cada
                keyword. Sem jargão técnico: um número, uma direção.
              </p>
            </FadeIn>

            <div className="space-y-5">
              {SCORE_FACTORS.map((f, i) => (
                <FadeIn key={f.label} delay={i * 100}>
                  <div>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <p className="font-mono text-sm">
                        <span className="font-semibold">{f.label}</span>{" "}
                        <span className="text-ink/40 text-xs">— {f.desc}</span>
                      </p>
                      <span className="font-display font-black text-lg text-ink/70">
                        {f.weight}%
                      </span>
                    </div>
                    <FillBar
                      pct={(f.weight / 30) * 100}
                      color="bg-signal"
                      delay={i * 120}
                    />
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* Mockup evolução */}
          <FadeIn delay={200}>
            <div className="relative">
              <div className="border-2 border-ink bg-white p-6 sm:p-8">
                <div className="flex items-baseline justify-between mb-8">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">
                    Evolução — 8 semanas
                  </p>
                  <p className="font-display font-black text-5xl">
                    <Counter from={42} to={78} duration={1800} />
                    <span className="font-mono font-normal text-sm text-ink/30">
                      /100
                    </span>
                  </p>
                </div>
                <ScoreBars />
                <div className="mt-6 pt-4 border-t border-ink/10 flex justify-between font-mono text-[11px] text-ink/40">
                  <span>semana 1 — score 42</span>
                  <span className="text-confirm font-semibold">
                    semana 8 — score 78 (+36)
                  </span>
                </div>
              </div>
              <div className="absolute inset-0 border-2 border-ink bg-signal -z-10 translate-x-2 translate-y-2" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ————— Benchmark ————— */}
      <section className="border-b border-ink/15">
        <div className="max-w-6xl mx-auto px-6 py-24 lg:py-32 grid lg:grid-cols-2 gap-14 items-center">
          <FadeIn className="lg:order-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-signal mb-6">
              04 — Benchmark
            </p>
            <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight mb-6 text-balance">
              Saiba quando o concorrente aparece no seu lugar
            </h2>
            <p className="font-mono text-sm font-light leading-[1.8] text-ink/70 max-w-lg">
              Monitore até 3 concorrentes por marca. A Velo avisa quando alguém
              ultrapassa seu score ou quando uma IA passa a recomendá-lo antes de
              você — com dados, não com achismo.
            </p>
          </FadeIn>

          <FadeIn delay={150} className="lg:order-1">
            <div className="relative">
              <div className="border-2 border-ink bg-white p-6 sm:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50 mb-6">
                  Share of voice — sua keyword principal
                </p>
                <div className="space-y-4">
                  {BENCHMARK.map((b, i) => (
                    <div key={b.name}>
                      <div className="flex justify-between mb-1.5">
                        <span
                          className={`font-mono text-[13px] ${
                            b.you ? "font-semibold text-confirm" : "text-ink/60"
                          }`}
                        >
                          {i + 1}. {b.name}
                          {b.you && " (você)"}
                        </span>
                        <span className="font-display font-black text-sm">
                          {b.score}
                        </span>
                      </div>
                      <FillBar
                        pct={b.score}
                        color={b.you ? "bg-confirm" : "bg-ink/30"}
                        delay={i * 130}
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-6 pt-4 border-t border-ink/10 font-mono text-[11px] text-signal">
                  ▲ OdontoPrime subiu 3 posições no Gemini esta semana
                </p>
              </div>
              <div className="absolute inset-0 border-2 border-ink bg-ink -z-10 translate-x-2 translate-y-2" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ————— Plano de ação ————— */}
      <section className="border-b border-ink/15">
        <div className="max-w-6xl mx-auto px-6 py-24 lg:py-32 grid lg:grid-cols-2 gap-14 items-center">
          <FadeIn>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-signal mb-6">
              05 — Plano de ação
            </p>
            <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight mb-6 text-balance">
              Dados sem direção não movem score
            </h2>
            <p className="font-mono text-sm font-light leading-[1.8] text-ink/70 max-w-lg">
              Para cada keyword com score baixo, a Velo gera recomendações
              específicas de conteúdo — o que publicar, onde e por quê.
              Priorizado pelo impacto estimado no seu GEO Score.
            </p>
          </FadeIn>

          <FadeIn delay={150}>
            <div className="relative">
              <div className="border-2 border-ink bg-white divide-y divide-ink/10">
                {ACTIONS.map((a) => (
                  <div key={a.text} className="p-5 flex gap-4 items-start">
                    <span
                      className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-1 border mt-0.5 ${
                        a.priority === "alta"
                          ? "border-signal text-signal"
                          : "border-navy text-navy"
                      }`}
                    >
                      {a.priority}
                    </span>
                    <p className="font-mono text-[13px] font-light leading-[1.7] text-ink/70">
                      {a.text}
                    </p>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 border-2 border-ink bg-confirm -z-10 translate-x-2 translate-y-2" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ————— Preços ————— */}
      <section id="precos">
        <div className="max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <FadeIn>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-signal mb-6 text-center">
              06 — Preços
            </p>
            <h2 className="font-display font-black text-3xl sm:text-5xl tracking-tight text-center mb-4 text-balance">
              Menos que uma hora de agência por mês
            </h2>
            <p className="font-mono text-sm font-light text-ink/60 text-center mb-10">
              7 dias grátis em qualquer plano. Cartão ou Pix. Sem contrato de
              fidelidade.
            </p>

            {/* toggle */}
            <div className="flex justify-center mb-14">
              <div className="inline-flex border border-ink">
                <button
                  onClick={() => setAnnual(false)}
                  aria-pressed={!annual}
                  className={`font-mono text-xs uppercase tracking-[0.15em] px-5 py-2.5 transition-colors ${
                    !annual ? "bg-ink text-bone" : "text-ink/60 hover:text-ink"
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setAnnual(true)}
                  aria-pressed={annual}
                  className={`font-mono text-xs uppercase tracking-[0.15em] px-5 py-2.5 transition-colors ${
                    annual ? "bg-ink text-bone" : "text-ink/60 hover:text-ink"
                  }`}
                >
                  Anual −20%
                </button>
              </div>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-0 lg:border lg:border-ink/15 lg:divide-x lg:divide-ink/15 items-stretch">
            {PLANS.map((plan, i) => {
              const price = annual ? Math.round(plan.monthly * 0.8) : plan.monthly;
              return (
                <FadeIn key={plan.name} delay={i * 120} className="h-full">
                  <div
                    className={`relative h-full p-8 lg:p-10 flex flex-col ${
                      plan.highlight
                        ? "bg-ink text-bone border-2 border-ink"
                        : "border border-ink/15 lg:border-0 bg-bone"
                    }`}
                  >
                    {plan.highlight && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-signal text-bone font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1.5">
                        Mais escolhido
                      </span>
                    )}
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] mb-5 opacity-60">
                      {plan.name}
                    </p>
                    <p className="font-display font-black text-5xl mb-1">
                      R${price}
                      <span className="font-mono font-normal text-sm opacity-50">
                        /mês
                      </span>
                    </p>
                    {annual && (
                      <p className="font-mono text-[11px] text-signal">
                        cobrado anualmente
                      </p>
                    )}
                    <ul className="space-y-3 mt-7 mb-10 flex-1">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2.5 font-mono text-[13px] font-light"
                        >
                          <Check
                            size={14}
                            className={`shrink-0 mt-0.5 ${
                              plan.highlight ? "text-signal" : "text-confirm"
                            }`}
                          />
                          <span
                            className={plan.highlight ? "text-bone/80" : "text-ink/70"}
                          >
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/auth/signup"
                      className={`block text-center font-mono text-sm font-semibold px-6 py-3.5 transition-colors ${
                        plan.highlight
                          ? "bg-signal text-bone hover:bg-bone hover:text-ink"
                          : "border border-ink text-ink hover:bg-ink hover:text-bone"
                      }`}
                    >
                      Começar 7 dias grátis
                    </Link>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ————— Teste grátis ————— */}
      <section id="teste-gratis" className="border-t border-ink/15">
        <div className="max-w-4xl mx-auto px-6 py-24 lg:py-32">
          <FadeIn>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-signal mb-6">
              Teste grátis — sem cadastro
            </p>
            <h2 className="font-display font-black text-3xl sm:text-5xl tracking-tight mb-6 text-balance">
              Veja agora como o ChatGPT descreve sua marca
            </h2>
            <p className="font-mono text-sm font-light leading-[1.8] text-ink/70 mb-10 max-w-lg">
              Digite sua marca e o que seu cliente perguntaria. Nós perguntamos
              ao ChatGPT de verdade e mostramos a resposta.
            </p>
          </FadeIn>
          <FadeIn delay={120}>
            <FreeChecker />
          </FadeIn>
        </div>
      </section>

      {/* ————— CTA final ————— */}
      <section className="bg-ink text-bone border-t-2 border-ink">
        <div className="max-w-4xl mx-auto px-6 py-24 lg:py-32 text-center">
          <FadeIn>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-signal mb-6">
              Primeiro resultado em até 24 horas
            </p>
            <h2 className="font-display font-black text-4xl sm:text-6xl tracking-tight mb-8 text-balance">
              Descubra o que as IAs já estão falando sobre você
            </h2>
            <Link
              href="/auth/signup"
              className="group inline-flex items-center gap-3 bg-signal text-bone font-mono text-sm font-semibold px-9 py-4 hover:bg-bone hover:text-ink transition-colors"
            >
              Ver minha presença agora
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-bone/40 mt-6">
              7 dias grátis · Sem cartão · Cancele quando quiser
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ————— Footer ————— */}
      <footer className="bg-ink text-bone border-t border-bone/15">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <p className="font-display font-bold text-xl mb-1.5">
              v<span className="text-signal">e</span>lo
            </p>
            <p className="font-mono text-[11px] text-bone/40 max-w-xs leading-relaxed">
              Monitore sua presença nas IAs em tempo real. GEO para marcas
              brasileiras.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-mono text-[11px] uppercase tracking-[0.15em] text-bone/50 hover:text-bone transition-colors"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/auth/login"
              className="font-mono text-[11px] uppercase tracking-[0.15em] text-bone/50 hover:text-bone transition-colors"
            >
              Entrar
            </Link>
          </nav>
        </div>
        <div className="border-t border-bone/10">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-[11px] text-bone/30">
              © 2026 Velo · Feito no Brasil
            </p>
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              <Link
                href="/legal/termos"
                className="font-mono text-[11px] uppercase tracking-[0.15em] text-bone/30 hover:text-bone transition-colors"
              >
                Termos de Uso
              </Link>
              <Link
                href="/legal/privacidade"
                className="font-mono text-[11px] uppercase tracking-[0.15em] text-bone/30 hover:text-bone transition-colors"
              >
                Privacidade
              </Link>
              <Link
                href="/legal/lgpd"
                className="font-mono text-[11px] uppercase tracking-[0.15em] text-bone/30 hover:text-bone transition-colors"
              >
                LGPD
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* Barras do gráfico de evolução — crescem quando visíveis */
function ScoreBars() {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const max = Math.max(...WEEKLY_SCORES);
  return (
    <div ref={ref} className="flex items-end gap-2 h-36">
      {WEEKLY_SCORES.map((s, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end h-full">
          <div
            className={i === WEEKLY_SCORES.length - 1 ? "bg-confirm" : "bg-ink/25"}
            style={{
              height: inView ? `${(s / max) * 100}%` : "0%",
              transition: `height 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${i * 90}ms`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
