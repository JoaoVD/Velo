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
    return (
      <div className="font-mono text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-10 text-center">
        Nenhuma marca cadastrada.
      </div>
    );
  }

  const scores = await apiFetch<Score[]>(`/brands/${brandId}/scores`, token).catch(
    () => [] as Score[]
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl text-slate-900">Histórico</h1>
        <p className="font-mono text-sm text-slate-500 mt-1.5">
          Evolução do GEO Score ao longo do tempo
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {scores.length === 0 ? (
          <div className="text-center py-8">
            <p className="font-mono text-sm text-slate-400">
              Nenhum histórico disponível ainda.
            </p>
          </div>
        ) : (
          <ScoreHistoryChart scores={scores} />
        )}
      </div>
    </div>
  );
}
