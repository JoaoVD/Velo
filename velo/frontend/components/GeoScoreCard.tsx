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
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
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
      <p className="font-mono text-xs text-slate-400 mt-2">GEO Score / 100</p>
    </div>
  );
}
