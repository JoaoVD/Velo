"use client";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { useToast } from "@/lib/toast";
import { createClient } from "@/lib/supabase-browser";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 149,
    tag: null,
    description: "Para PMEs que querem saber onde estão.",
    features: ["1 marca monitorada", "10 keywords", "Scan semanal", "ChatGPT + Gemini", "Relatório por e-mail"],
    cta: "Plano atual",
    current: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 399,
    tag: "Mais escolhido",
    description: "Para quem quer subir no ranking das IAs.",
    features: ["3 marcas", "30 keywords por marca", "Scan diário", "Alertas de queda de score", "Plano de ação semanal por IA"],
    cta: "Fazer upgrade →",
    current: false,
  },
  {
    id: "agency",
    name: "Agency",
    price: 799,
    tag: null,
    description: "Para agências que revendem GEO.",
    features: ["Marcas ilimitadas", "Keywords ilimitadas", "Relatório white-label", "PDF mensal automático"],
    cta: "Falar com a equipe →",
    current: false,
    href: "mailto:contato@velo.com.br",
  },
] as const;

export default function PricingPage() {
  const { toast } = useToast();
  const [modal, setModal] = useState<"pro" | "agency" | null>(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function handleInterest(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !modal) return;
    setSending(true);
    try {
      const supabase = createClient();
      await supabase.from("upgrade_interest").insert({ email, target_plan: modal, current_plan: "starter" });
      toast("Entraremos em contato em breve!");
      setEmail("");
      setModal(null);
    } catch {
      toast("Erro ao registrar interesse. Tente novamente.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div className="mb-10 text-center max-w-xl mx-auto">
        <h1 className="font-display font-black text-3xl text-slate-900 mb-2">Planos</h1>
        <p className="font-mono text-sm text-slate-500">Comece grátis por 7 dias. Sem cartão de crédito.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`bg-white rounded-3xl border p-6 relative flex flex-col shadow-[0_1px_2px_rgba(15,25,35,0.04),0_16px_40px_-20px_rgba(15,25,35,0.12)] ${plan.id === "pro" ? "border-moss-300 ring-1 ring-moss-200" : "border-slate-200/80"}`}>
            {plan.tag && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-widest font-semibold bg-moss-600 text-white px-3 py-1 rounded-full">
                {plan.tag}
              </span>
            )}
            <div className="mb-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">{plan.name}</p>
              <p className="font-display font-black text-3xl text-slate-900">
                R${plan.price}<span className="font-mono text-sm font-normal text-slate-400">/mês</span>
              </p>
              <p className="font-mono text-xs text-slate-500 mt-1.5 leading-relaxed">{plan.description}</p>
            </div>
            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 font-mono text-xs text-slate-600">
                  <Check size={12} className="text-moss-600 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {plan.current ? (
              <div className="text-center font-mono text-xs text-slate-400 border border-slate-100 rounded-full py-2.5">
                {plan.cta}
              </div>
            ) : "href" in plan && plan.href ? (
              <a href={plan.href} className="block text-center font-mono text-sm font-semibold text-slate-700 border border-slate-200 rounded-full py-2.5 hover:bg-slate-50 transition-colors">
                {plan.cta}
              </a>
            ) : (
              <button
                onClick={() => setModal(plan.id as "pro" | "agency")}
                className="block w-full text-center font-mono text-sm font-semibold text-white bg-moss-600 rounded-full py-2.5 shadow-[0_8px_20px_-6px_rgba(63,107,78,0.4)] hover:bg-moss-700 transition-colors"
              >
                {plan.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Upgrade interest modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,25,35,0.05),0_32px_64px_-24px_rgba(15,25,35,0.3)] p-8 w-full max-w-sm relative">
            <button onClick={() => setModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={16} /></button>
            <h2 className="font-display font-black text-xl text-slate-900 mb-1">Em breve</h2>
            <p className="font-mono text-xs text-slate-500 mb-5">
              O plano {modal === "pro" ? "Pro" : "Agency"} está em fase final. Deixe seu e-mail e avisamos primeiro.
            </p>
            <form onSubmit={handleInterest} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 bg-white"
              />
              <button type="submit" disabled={sending} className="w-full bg-moss-600 text-white py-2.5 rounded-full font-mono text-sm font-semibold hover:bg-moss-700 transition-colors disabled:opacity-60">
                {sending ? "Enviando..." : "Me avisar quando lançar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
