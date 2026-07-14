"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionPlan, Keyword } from "@/lib/types";

interface Props {
  plans: ActionPlan[];
  keywords: Keyword[];
}

const STORAGE_KEY = "velo-action-plan-done";

const PRIORITY_CONFIG = {
  high: {
    label: "Alta",
    chip: "bg-red-50 text-red-700 border-red-100",
    rail: "bg-red-400/80",
    ring: "ring-red-100",
  },
  medium: {
    label: "Média",
    chip: "bg-amber-50 text-amber-700 border-amber-100",
    rail: "bg-amber-400/80",
    ring: "ring-amber-100",
  },
  low: {
    label: "Baixa",
    chip: "bg-moss-50 text-moss-700 border-moss-100",
    rail: "bg-moss-200",
    ring: "ring-moss-100",
  },
} as const;

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
};

type PriorityFilter = "all" | "high" | "medium" | "low";

const FILTERS: { value: PriorityFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "high", label: "Alta" },
  { value: "medium", label: "Média" },
  { value: "low", label: "Baixa" },
];

/** Quebra a recomendação (parágrafo do LLM) em passos legíveis. */
function splitIntoSteps(text: string): string[] {
  const steps = text
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ])/)
    .map((s) => s.trim())
    .filter(Boolean);
  return steps.length > 1 ? steps : [text];
}

export function ActionPlanList({ plans, keywords }: Props) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState<PriorityFilter>("all");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(saved)) setDone(new Set(saved));
    } catch {
      /* estado limpo se o storage estiver corrompido */
    }
    setHydrated(true);
  }, []);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const kwMap = useMemo(
    () => Object.fromEntries(keywords.map((k) => [k.id, k.term])),
    [keywords]
  );

  const grouped = useMemo(() => {
    const g: Record<"high" | "medium" | "low", ActionPlan[]> = {
      high: [],
      medium: [],
      low: [],
    };
    for (const p of plans) {
      if (p.priority in g) g[p.priority].push(p);
    }
    return g;
  }, [plans]);

  const doneCount = plans.filter((p) => done.has(p.id)).length;
  const progress = plans.length ? Math.round((doneCount / plans.length) * 100) : 0;
  const allDone = hydrated && plans.length > 0 && doneCount === plans.length;

  const visible = (["high", "medium", "low"] as const).filter(
    (p) => filter === "all" || filter === p
  );

  let cardIndex = 0;

  return (
    <div>
      <style>{`
        @keyframes vap-rise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Progresso */}
      <div
        className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,25,35,0.04),0_16px_40px_-20px_rgba(15,25,35,0.12)] p-6 mb-8"
        style={{ animation: "vap-rise 0.5s ease-out both" }}
      >
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <p className="font-display font-black text-2xl text-slate-900 leading-none">
              {doneCount}
              <span className="text-slate-300"> / {plans.length}</span>
            </p>
            <p className="font-body text-xs text-slate-500 mt-1.5">
              {allDone
                ? "Tudo concluído — sua presença agradece."
                : "ações concluídas — marque conforme for executando"}
            </p>
          </div>
          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`font-body text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors ${
                  filter === f.value
                    ? "bg-ink text-bone border-ink"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-moss-600 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-8">
        {visible.map((priority) => {
          const group = grouped[priority];
          if (!group.length) return null;
          const cfg = PRIORITY_CONFIG[priority];
          const groupDone = group.filter((p) => done.has(p.id)).length;
          return (
            <section key={priority}>
              <div className="flex items-baseline gap-2 mb-3">
                <h2 className="font-body text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                  {cfg.label} prioridade
                </h2>
                <span className="font-body text-[11px] text-slate-300 font-semibold">
                  {groupDone}/{group.length}
                </span>
              </div>
              <div className="space-y-3">
                {group.map((plan) => {
                  const isDone = done.has(plan.id);
                  const steps = splitIntoSteps(plan.recommendation);
                  const delay = Math.min(cardIndex++, 8) * 60;
                  return (
                    <article
                      key={plan.id}
                      className={`relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden transition-all duration-300 ${
                        isDone
                          ? "opacity-55"
                          : "shadow-[0_1px_2px_rgba(15,25,35,0.04),0_12px_32px_-20px_rgba(15,25,35,0.14)]"
                      }`}
                      style={{ animation: `vap-rise 0.5s ease-out ${delay}ms both` }}
                    >
                      <span
                        className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.rail}`}
                        aria-hidden
                      />
                      <div className="p-5 pl-6">
                        <div className="flex items-start gap-3.5">
                          {/* Checkbox */}
                          <button
                            onClick={() => toggle(plan.id)}
                            aria-label={isDone ? "Desmarcar ação" : "Concluir ação"}
                            className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                              isDone
                                ? "bg-moss-600 border-moss-600 scale-105"
                                : `bg-white border-slate-300 hover:border-moss-600 hover:ring-4 ${cfg.ring}`
                            }`}
                          >
                            <svg
                              viewBox="0 0 12 12"
                              className={`w-3 h-3 transition-opacity ${
                                isDone ? "opacity-100" : "opacity-0"
                              }`}
                              fill="none"
                              stroke="#f5f2eb"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2 6.5 4.8 9 10 3.5" />
                            </svg>
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mb-3">
                              {kwMap[plan.keyword_id] && (
                                <h3
                                  className={`font-display font-bold text-base text-slate-900 leading-snug ${
                                    isDone ? "line-through decoration-slate-400" : ""
                                  }`}
                                >
                                  {kwMap[plan.keyword_id]}
                                </h3>
                              )}
                              <span
                                className={`font-body text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${cfg.chip}`}
                              >
                                {cfg.label}
                              </span>
                              <span className="font-body text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-full">
                                {ENGINE_LABELS[plan.engine] ?? plan.engine}
                              </span>
                            </div>

                            {isDone ? (
                              <p className="font-body text-xs text-slate-400">
                                Ação concluída. Clique no círculo para reabrir.
                              </p>
                            ) : (
                              <ol className="space-y-2.5">
                                {steps.map((step, i) => (
                                  <li key={i} className="flex gap-3">
                                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-moss-50 text-moss-700 font-body text-[10px] font-bold flex items-center justify-center">
                                      {i + 1}
                                    </span>
                                    <p className="font-body text-sm text-slate-700 leading-relaxed">
                                      {step}
                                    </p>
                                  </li>
                                ))}
                              </ol>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
