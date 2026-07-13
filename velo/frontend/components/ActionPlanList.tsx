import { ActionPlan, Keyword } from "@/lib/types";

interface Props {
  plans: ActionPlan[];
  keywords: Keyword[];
}

const PRIORITY_CONFIG = {
  high: {
    label: "Alta prioridade",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-100",
  },
  medium: {
    label: "Média prioridade",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-100",
  },
  low: {
    label: "Baixa prioridade",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-100",
  },
} as const;

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "Resposta do ChatGPT",
  gemini: "Resposta do Gemini",
};

export function ActionPlanList({ plans, keywords }: Props) {
  const kwMap = Object.fromEntries(keywords.map((k) => [k.id, k.term]));
  const grouped: Record<"high" | "medium" | "low", ActionPlan[]> = {
    high: [],
    medium: [],
    low: [],
  };
  for (const p of plans) {
    if (p.priority in grouped) grouped[p.priority].push(p);
  }

  return (
    <div className="space-y-6">
      {(["high", "medium", "low"] as const).map((priority) => {
        const group = grouped[priority];
        if (!group.length) return null;
        const cfg = PRIORITY_CONFIG[priority];
        return (
          <section key={priority}>
            <h2 className="font-body text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">
              {cfg.label} ({group.length})
            </h2>
            <div className="space-y-3">
              {group.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className={`font-body text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                    >
                      {cfg.label}
                    </span>
                    <span className="font-body text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                      {ENGINE_LABELS[plan.engine] ?? plan.engine}
                    </span>
                  </div>
                  <p className="font-body text-sm text-slate-800 leading-relaxed mb-3">
                    {plan.recommendation}
                  </p>
                  {kwMap[plan.keyword_id] && (
                    <p className="font-body text-[10px] text-slate-400">
                      Keyword:{" "}
                      <span className="text-slate-600">{kwMap[plan.keyword_id]}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
