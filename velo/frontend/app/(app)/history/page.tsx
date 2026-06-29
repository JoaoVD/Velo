import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiFetch } from "@/lib/api";
import { ScoreHistoryChart } from "@/components/ScoreHistoryChart";
import { Score } from "@/lib/types";

export default async function HistoryPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const brands = await apiFetch<{ id: string }[]>("/brands", token).catch(() => []);
  const brandId = brands[0]?.id;

  if (!brandId) {
    return <div className="font-mono text-sm text-ink/50">Nenhuma marca cadastrada.</div>;
  }

  const scores = await apiFetch<Score[]>(`/brands/${brandId}/scores`, token).catch(() => [] as Score[]);

  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-ink">Histórico</h1>
      <p className="font-mono text-sm text-ink/50 mt-1">Evolução do GEO Score ao longo do tempo</p>
      <div className="mt-6 bg-white rounded-xl border border-ink/10 p-6">
        {scores.length === 0 ? (
          <p className="font-mono text-sm text-ink/40">Nenhum histórico disponível ainda.</p>
        ) : (
          <ScoreHistoryChart scores={scores} />
        )}
      </div>
    </div>
  );
}
