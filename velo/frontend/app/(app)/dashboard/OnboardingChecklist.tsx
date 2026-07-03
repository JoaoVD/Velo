"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Clock, X, Gauge, Users, Target } from "lucide-react";

const STORAGE_KEY = "velo_onboarding_dismissed";

interface Props {
  keywordCount: number;
  competitorCount: number;
  hasScores: boolean;
}

export default function OnboardingChecklist({ keywordCount, competitorCount, hasScores }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Some quando tudo estiver completo e o usuário já tiver visto, ou quando dispensado
    if (localStorage.getItem(STORAGE_KEY) !== "1") setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  const steps = [
    { label: "Marca cadastrada", done: true },
    { label: `Keywords monitoradas (${keywordCount})`, done: keywordCount > 0, href: "/keywords" },
    {
      label: competitorCount > 0 ? `Concorrentes (${competitorCount})` : "Adicionar concorrentes (opcional)",
      done: competitorCount > 0,
      href: "/settings",
    },
    {
      label: hasScores ? "Primeiro scan concluído" : "Primeiro scan em andamento — pronto em até 24h",
      done: hasScores,
      pending: !hasScores,
    },
  ];

  const guide = [
    {
      icon: Gauge,
      title: "GEO Score",
      text: "Nota de 0 a 100 por IA: menção (30%), posição (25%), sentimento (25%) e frequência (20%).",
    },
    {
      icon: Users,
      title: "Share of Voice",
      text: "Compara quantas vezes você e seus concorrentes aparecem nas mesmas perguntas.",
    },
    {
      icon: Target,
      title: "Plano de Ação",
      text: "Recomendações concretas de conteúdo para subir o score, priorizadas por impacto.",
    },
  ];

  return (
    <div className="relative bg-gradient-to-br from-moss-50/80 to-white rounded-3xl border border-moss-100 shadow-[0_1px_2px_rgba(15,25,35,0.04),0_16px_40px_-20px_rgba(63,107,78,0.25)] p-6 sm:p-7 mb-6">
      <button
        onClick={dismiss}
        aria-label="Dispensar guia"
        className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
      >
        <X size={16} />
      </button>

      <h2 className="font-display font-black text-lg text-slate-900 mb-1">
        Bem-vindo à Velo — comece por aqui
      </h2>
      <p className="font-mono text-xs text-slate-500 mb-5">
        Seu monitoramento já está configurado. Enquanto o primeiro scan roda, entenda o que você vai ver neste painel.
      </p>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Checklist */}
        <ul className="space-y-2.5">
          {steps.map((s) => (
            <li key={s.label} className="flex items-center gap-2.5">
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
                  s.done
                    ? "bg-moss-600 text-white"
                    : s.pending
                      ? "bg-amber-100 text-amber-600"
                      : "bg-slate-200 text-slate-400"
                }`}
              >
                {s.done ? <Check size={11} /> : s.pending ? <Clock size={11} /> : <Check size={11} />}
              </span>
              {s.href && !s.done ? (
                <Link href={s.href} className="font-mono text-xs text-moss-700 hover:underline">
                  {s.label} →
                </Link>
              ) : (
                <span className={`font-mono text-xs ${s.done ? "text-slate-600" : "text-slate-500"}`}>
                  {s.label}
                </span>
              )}
            </li>
          ))}
          <li className="pt-1">
            <span className="font-mono text-[11px] text-slate-400">
              Você receberá um relatório semanal por e-mail com a evolução do score.
            </span>
          </li>
        </ul>

        {/* Mini-guia */}
        <div className="space-y-3">
          {guide.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3 items-start">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white border border-moss-100 text-moss-600 shrink-0 mt-0.5">
                <Icon size={13} />
              </span>
              <div>
                <p className="font-mono text-xs font-semibold text-slate-700">{title}</p>
                <p className="font-mono text-[11px] leading-[1.6] text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
