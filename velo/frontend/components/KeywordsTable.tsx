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
    if (
      !scoreMap[s.keyword_id][s.engine] ||
      s.date > (scoreMap[s.keyword_id][dateKey] as string ?? "")
    ) {
      scoreMap[s.keyword_id][s.engine] = s.geo_score;
      scoreMap[s.keyword_id][dateKey] = s.date;
    }
  }

  const scoreColor = (v: number) =>
    v >= 70
      ? "text-emerald-600 font-semibold"
      : v >= 40
      ? "text-amber-500 font-semibold"
      : "text-red-600 font-semibold";

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-slate-100 text-left">
          <th className="pb-3 font-mono text-[10px] uppercase tracking-widest text-slate-400 font-medium">
            Keyword
          </th>
          {(engineFilter === "all" || engineFilter === "chatgpt") && (
            <th className="pb-3 font-mono text-[10px] uppercase tracking-widest text-slate-400 font-medium">
              ChatGPT
            </th>
          )}
          {(engineFilter === "all" || engineFilter === "gemini") && (
            <th className="pb-3 font-mono text-[10px] uppercase tracking-widest text-slate-400 font-medium">
              Gemini
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {keywords.map((kw) => (
          <tr
            key={kw.id}
            className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
          >
            <td className="py-3 font-mono text-sm text-slate-700">{kw.term}</td>
            {(engineFilter === "all" || engineFilter === "chatgpt") && (
              <td
                className={`py-3 font-mono text-sm ${scoreColor(
                  (scoreMap[kw.id]?.chatgpt as number) ?? 0
                )}`}
              >
                {scoreMap[kw.id]?.chatgpt !== undefined
                  ? (scoreMap[kw.id].chatgpt as number).toFixed(0)
                  : <span className="text-slate-300">—</span>}
              </td>
            )}
            {(engineFilter === "all" || engineFilter === "gemini") && (
              <td
                className={`py-3 font-mono text-sm ${scoreColor(
                  (scoreMap[kw.id]?.gemini as number) ?? 0
                )}`}
              >
                {scoreMap[kw.id]?.gemini !== undefined
                  ? (scoreMap[kw.id].gemini as number).toFixed(0)
                  : <span className="text-slate-300">—</span>}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
