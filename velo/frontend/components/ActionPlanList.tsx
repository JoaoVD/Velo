import { ActionPlan, Keyword } from "@/lib/types";

const PRIORITY_LABEL: Record<string, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const PRIORITY_STYLES: Record<string, string> = {
  high:   "bg-red-50 text-red-700 border border-red-100",
  medium: "bg-amber-50 text-amber-700 border border-amber-100",
  low:    "bg-moss-50 text-moss-600 border border-moss-100",
};

interface Props {
  plans: ActionPlan[];
  keywords: Keyword[];
}

export function ActionPlanList({ plans, keywords }: Props) {
  const kwMap = Object.fromEntries(keywords.map((k) => [k.id, k.term]));
  const sorted = [...plans].sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <ul className="space-y-3">
      {sorted.map((plan) => (
        <li
          key={plan.id}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2.5">
            <span
              className={`font-mono text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                PRIORITY_STYLES[plan.priority]
              }`}
            >
              {PRIORITY_LABEL[plan.priority]}
            </span>
            <span className="font-mono text-[10px] text-slate-400 capitalize">{plan.engine}</span>
            <span className="text-slate-200">·</span>
            <span className="font-mono text-[10px] text-slate-500 truncate">
              {kwMap[plan.keyword_id] ?? plan.keyword_id}
            </span>
          </div>
          <p className="font-mono text-sm text-slate-700 leading-relaxed">
            {plan.recommendation}
          </p>
        </li>
      ))}
    </ul>
  );
}
