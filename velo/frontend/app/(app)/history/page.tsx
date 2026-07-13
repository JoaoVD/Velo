import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiFetch } from "@/lib/api";
import { ScoreHistoryChart } from "@/components/ScoreHistoryChart";
import { Score } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function HistoryPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");
  const token = session.access_token;

  const brands = await apiFetch<{ id: string }[]>("/brands", token).catch(() => []);
  const brandId = brands[0]?.id;
  if (!brandId) redirect("/onboarding");

  const scores = await apiFetch<Score[]>(`/brands/${brandId}/scores`, token).catch(() => [] as Score[]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl text-slate-900">Histórico</h1>
        <p className="font-body text-sm text-slate-500 mt-1.5">Evolução do GEO Score ao longo do tempo</p>
      </div>
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,25,35,0.04),0_16px_40px_-20px_rgba(15,25,35,0.12)] p-6">
        {scores.length === 0 ? (
          <div className="text-center py-10">
            <p className="font-display font-black text-lg text-slate-700 mb-2">Nenhum histórico ainda</p>
            <p className="font-body text-sm text-slate-400">Histórico disponível após o primeiro scan completo.</p>
          </div>
        ) : (
          <ScoreHistoryChart scores={scores} />
        )}
      </div>
    </div>
  );
}
