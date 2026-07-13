import { ShareOfVoiceEntry } from "@/lib/types";

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
};

function Bar({ label, value, highlight, losing }: {
  label: string;
  value: number;
  highlight?: boolean;
  losing?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`font-body text-xs w-36 shrink-0 truncate ${
          highlight ? "text-slate-900 font-semibold" : "text-slate-500"
        }`}
        title={label}
      >
        {label}
      </span>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            highlight ? (losing ? "bg-amber-500" : "bg-moss-600") : "bg-slate-300"
          }`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="font-body text-xs text-slate-500 w-10 text-right">
        {Math.round(value)}%
      </span>
    </div>
  );
}

export function ShareOfVoiceCard({
  entries,
  brandName,
}: {
  entries: ShareOfVoiceEntry[];
  brandName: string;
}) {
  return (
    <div className="space-y-6">
      {entries.map((entry) => {
        const topCompetitor = Math.max(0, ...entry.competitors.map((c) => c.frequency_score));
        const losing = topCompetitor > entry.brand_frequency;
        return (
          <div key={`${entry.keyword_id}-${entry.engine}`}>
            <div className="flex items-center justify-between mb-2.5">
              <p className="font-body text-xs text-slate-700 font-semibold">
                &ldquo;{entry.term}&rdquo;
                <span className="ml-2 text-[10px] uppercase tracking-widest text-slate-400 font-normal">
                  {ENGINE_LABELS[entry.engine] ?? entry.engine}
                </span>
              </p>
              {losing && (
                <span className="font-body text-[10px] uppercase tracking-widest text-amber-600 font-semibold">
                  Concorrente à frente
                </span>
              )}
            </div>
            <div className="space-y-2">
              <Bar label={brandName} value={entry.brand_frequency} highlight losing={losing} />
              {[...entry.competitors]
                .sort((a, b) => b.frequency_score - a.frequency_score)
                .map((c) => (
                  <Bar key={c.id} label={c.name} value={c.frequency_score} />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
