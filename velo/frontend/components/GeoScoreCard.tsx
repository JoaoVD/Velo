import { Info } from "lucide-react";

interface GeoScoreCardProps {
  engine: string;
  score: number;
  previousScore?: number;
}

export function GeoScoreCard({ engine, score, previousScore }: GeoScoreCardProps) {
  const diff = previousScore !== undefined ? score - previousScore : null;

  const scoreColor =
    score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-500" : "text-red-600";

  const diffColor = diff !== null && diff >= 0 ? "text-emerald-600" : "text-red-600";
  const diffBg   = diff !== null && diff >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100";

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-[0_1px_2px_rgba(15,25,35,0.04),0_16px_40px_-20px_rgba(15,25,35,0.12)]">
      <div className="flex items-start justify-between mb-4">
        <p className="font-mono text-[10px] font-semibold text-slate-400 uppercase tracking-widest capitalize">
          {engine}
        </p>
        {diff !== null && (
          <span className={`font-mono text-xs font-semibold px-2.5 py-1 rounded-full border ${diffColor} ${diffBg}`}>
            {diff >= 0 ? "+" : ""}{diff.toFixed(1)} pts
          </span>
        )}
      </div>
      <p className={`font-display font-black text-6xl leading-none ${scoreColor}`}>
        {score.toFixed(0)}
      </p>
      <div className="group relative mt-2 inline-flex items-center gap-1.5">
        <p className="font-mono text-xs text-slate-400">GEO Score / 100</p>
        <Info size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors cursor-help" />
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-0 mb-2 w-60 rounded-2xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-[1.6] px-4 py-3 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl z-20"
        >
          Composição do score: <strong className="text-white">menção 30%</strong>,{" "}
          <strong className="text-white">posição 25%</strong>,{" "}
          <strong className="text-white">sentimento 25%</strong> e{" "}
          <strong className="text-white">frequência 20%</strong> — medidos em cada
          resposta da IA para suas keywords.
        </div>
      </div>
    </div>
  );
}
