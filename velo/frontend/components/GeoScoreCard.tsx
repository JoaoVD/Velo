interface GeoScoreCardProps {
  engine: string;
  score: number;
  previousScore?: number;
}

export function GeoScoreCard({ engine, score, previousScore }: GeoScoreCardProps) {
  const diff = previousScore !== undefined ? score - previousScore : null;
  const scoreColor =
    score >= 70 ? "text-confirm" : score >= 40 ? "text-signal" : "text-red-700";

  return (
    <div className="bg-ice border border-ink/10 rounded-xl p-6">
      <p className="font-mono text-xs font-medium text-ink/50 uppercase tracking-widest capitalize">
        {engine}
      </p>
      <p className={`font-display font-black text-6xl mt-3 leading-none ${scoreColor}`}>
        {score.toFixed(0)}
      </p>
      <p className="font-mono text-xs text-ink/40 mt-1">GEO Score / 100</p>
      {diff !== null && (
        <p className={`font-mono text-sm mt-4 ${diff >= 0 ? "text-confirm" : "text-red-700"}`}>
          {diff >= 0 ? "+" : ""}{diff.toFixed(1)} vs semana anterior
        </p>
      )}
    </div>
  );
}
