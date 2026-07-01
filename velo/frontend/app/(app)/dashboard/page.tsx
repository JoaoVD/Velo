import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiFetch } from "@/lib/api";
import { GeoScoreCard } from "@/components/GeoScoreCard";
import { ScoreHistoryChart } from "@/components/ScoreHistoryChart";
import { KeywordsTable } from "@/components/KeywordsTable";
import { Brand, Keyword, Score } from "@/lib/types";
import { redirect } from "next/navigation";
import ForceScanButton from "./ForceScanButton";

function getLatestScoreByEngine(scores: Score[]): Record<string, number> {
  const byEngine: Record<string, Score[]> = {};
  for (const s of scores) {
    if (!byEngine[s.engine]) byEngine[s.engine] = [];
    byEngine[s.engine].push(s);
  }
  const result: Record<string, number> = {};
  for (const [engine, list] of Object.entries(byEngine)) {
    const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
    const latestDate = sorted[0].date;
    const latest = sorted.filter((s) => s.date === latestDate);
    result[engine] = latest.reduce((sum, s) => sum + s.geo_score, 0) / latest.length;
  }
  return result;
}

function getPreviousScoreByEngine(scores: Score[]): Record<string, number> {
  const byEngine: Record<string, Score[]> = {};
  for (const s of scores) {
    if (!byEngine[s.engine]) byEngine[s.engine] = [];
    byEngine[s.engine].push(s);
  }
  const result: Record<string, number> = {};
  for (const [engine, list] of Object.entries(byEngine)) {
    const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
    const dates = Array.from(new Set(sorted.map((s) => s.date)));
    if (dates.length < 2) continue;
    const prevDate = dates[1];
    const prev = sorted.filter((s) => s.date === prevDate);
    result[engine] = prev.reduce((sum, s) => sum + s.geo_score, 0) / prev.length;
  }
  return result;
}

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const brands = await apiFetch<Brand[]>("/brands", token).catch(() => [] as Brand[]);
  const brand = brands[0];
  if (!brand) redirect("/onboarding");

  const [scores, keywords] = await Promise.all([
    apiFetch<Score[]>(`/brands/${brand.id}/scores`, token).catch(() => [] as Score[]),
    apiFetch<Keyword[]>(`/brands/${brand.id}/keywords`, token).catch(() => [] as Keyword[]),
  ]);

  const currentScores = getLatestScoreByEngine(scores);
  const previousScores = getPreviousScoreByEngine(scores);
  const engines = Object.keys(currentScores);
  const overall =
    engines.length > 0
      ? engines.reduce((sum, e) => sum + currentScores[e], 0) / engines.length
      : null;
  const overallPrev =
    engines.length > 0 && Object.keys(previousScores).length === engines.length
      ? engines.reduce((sum, e) => sum + (previousScores[e] ?? currentScores[e]), 0) /
        engines.length
      : undefined;

  const hasScores = scores.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start gap-4 justify-between">
        <div>
          <h1 className="font-display font-black text-3xl text-slate-900">{brand.name}</h1>
          <p className="font-mono text-sm text-slate-500 mt-1">
            Presença nas IAs generativas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full font-semibold">
            Starter
          </span>
          <ForceScanButton />
        </div>
      </div>

      {!hasScores ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-moss-50 border border-moss-100 mb-5">
            <span className="font-display font-black text-2xl text-moss-600 animate-pulse">·</span>
          </div>
          <h2 className="font-display font-black text-xl text-slate-900 mb-2">
            Primeiro scan em andamento
          </h2>
          <p className="font-mono text-sm text-slate-400 max-w-sm mx-auto">
            Seu GEO Score estará pronto em até 24h após o cadastro.
          </p>
          <div className="mt-6 mx-auto max-w-xs h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-moss-200 rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Score cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {overall !== null && (
              <GeoScoreCard
                engine="Geral"
                score={Math.round(overall)}
                previousScore={
                  overallPrev !== undefined ? Math.round(overallPrev) : undefined
                }
              />
            )}
            {engines.map((engine) => (
              <GeoScoreCard
                key={engine}
                engine={engine}
                score={Math.round(currentScores[engine])}
                previousScore={
                  previousScores[engine] !== undefined
                    ? Math.round(previousScores[engine])
                    : undefined
                }
              />
            ))}
          </div>

          {/* History chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-5">
              Histórico de GEO Score
            </h2>
            <ScoreHistoryChart scores={scores} />
          </div>

          {/* Keywords table */}
          {keywords.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-5">
                Score por Keyword
              </h2>
              <KeywordsTable keywords={keywords} scores={scores} engineFilter="all" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
