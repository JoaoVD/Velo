import { ActionPlan, Keyword } from "@/lib/types";

const PRIORITY_LABEL: Record<string, string> = { high: "Alta", medium: "Média", low: "Baixa" };
const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
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
        <li key={plan.id} className="bg-white rounded-xl border border-ink/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`font-mono text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[plan.priority]}`}>
              {PRIORITY_LABEL[plan.priority]}
            </span>
            <span className="font-mono text-xs text-ink/40 capitalize">{plan.engine}</span>
            <span className="font-mono text-xs text-ink/30">·</span>
            <span className="font-mono text-xs text-ink/50">{kwMap[plan.keyword_id] ?? plan.keyword_id}</span>
          </div>
          <p className="font-mono text-sm text-ink">{plan.recommendation}</p>
        </li>
      ))}
    </ul>
  );
}
