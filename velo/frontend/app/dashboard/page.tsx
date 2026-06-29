import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiFetch } from "@/lib/api";
import { GeoScoreCard } from "@/components/GeoScoreCard";
import { Score } from "@/lib/types";

async function getBrandId(token: string): Promise<string | null> {
  try {
    const brands = await apiFetch<{ id: string }[]>("/brands", token);
    return brands[0]?.id ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const brandId = await getBrandId(token);

  if (!brandId) {
    return (
      <div>
        <h1 className="font-display font-bold text-3xl text-ink">Dashboard</h1>
        <p className="mt-4 font-mono text-sm text-ink/50">
          Nenhuma marca cadastrada.{" "}
          <a href="/settings" className="text-signal hover:underline">Adicione sua marca →</a>
        </p>
      </div>
    );
  }

  const scores = await apiFetch<Score[]>(`/brands/${brandId}/scores`, token).catch(() => [] as Score[]);

  const latestByEngine: Record<string, Score[]> = {};
  for (const score of scores) {
    if (!latestByEngine[score.engine]) latestByEngine[score.engine] = [];
    latestByEngine[score.engine].push(score);
  }

  const currentScores: Record<string, number> = {};
  for (const [engine, engineScores] of Object.entries(latestByEngine)) {
    const sorted = engineScores.sort((a, b) => b.date.localeCompare(a.date));
    const recent = sorted.slice(0, 10);
    currentScores[engine] = recent.reduce((sum, s) => sum + s.geo_score, 0) / recent.length;
  }

  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-ink">Dashboard</h1>
      <p className="font-mono text-sm text-ink/50 mt-1">Presença da sua marca nas IAs generativas</p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(currentScores).map(([engine, score]) => (
          <GeoScoreCard key={engine} engine={engine} score={score} />
        ))}
        {Object.keys(currentScores).length === 0 && (
          <p className="font-mono text-sm text-ink/40 col-span-2">
            Nenhum score disponível ainda. O primeiro relatório será gerado na próxima segunda-feira.
          </p>
        )}
      </div>
    </div>
  );
}
