"use client";
import { Score, Keyword } from "@/lib/types";

interface Props {
  keywords: Keyword[];
  scores: Score[];
  engineFilter: "chatgpt" | "gemini" | "all";
}

export function KeywordsTable({ keywords, scores, engineFilter }: Props) {
  const scoreMap: Record<string, Record<string, number | string>> = {};
  for (const s of scores) {
    if (!scoreMap[s.keyword_id]) scoreMap[s.keyword_id] = {};
    const dateKey = `${s.engine}_date`;
    if (!scoreMap[s.keyword_id][s.engine] || s.date > (scoreMap[s.keyword_id][dateKey] as string ?? "")) {
      scoreMap[s.keyword_id][s.engine] = s.geo_score;
      scoreMap[s.keyword_id][dateKey] = s.date;
    }
  }

  const scoreColor = (v: number) =>
    v >= 70
      ? "text-confirm font-semibold"
      : v >= 40
      ? "text-signal font-semibold"
      : "text-red-700 font-semibold";

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-ink/10 text-left">
          <th className="pb-2 font-mono text-xs text-ink/50 font-medium">Keyword</th>
          {(engineFilter === "all" || engineFilter === "chatgpt") && (
            <th className="pb-2 font-mono text-xs text-ink/50 font-medium">ChatGPT</th>
          )}
          {(engineFilter === "all" || engineFilter === "gemini") && (
            <th className="pb-2 font-mono text-xs text-ink/50 font-medium">Gemini</th>
          )}
        </tr>
      </thead>
      <tbody>
        {keywords.map((kw) => (
          <tr key={kw.id} className="border-b border-ink/5 hover:bg-ice/50">
            <td className="py-3 font-mono text-sm text-ink">{kw.term}</td>
            {(engineFilter === "all" || engineFilter === "chatgpt") && (
              <td className={`py-3 font-mono text-sm ${scoreColor((scoreMap[kw.id]?.chatgpt as number) ?? 0)}`}>
                {scoreMap[kw.id]?.chatgpt !== undefined
                  ? (scoreMap[kw.id].chatgpt as number).toFixed(0)
                  : "—"}
              </td>
            )}
            {(engineFilter === "all" || engineFilter === "gemini") && (
              <td className={`py-3 font-mono text-sm ${scoreColor((scoreMap[kw.id]?.gemini as number) ?? 0)}`}>
                {scoreMap[kw.id]?.gemini !== undefined
                  ? (scoreMap[kw.id].gemini as number).toFixed(0)
                  : "—"}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
