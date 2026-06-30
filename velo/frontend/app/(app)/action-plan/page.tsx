import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiFetch } from "@/lib/api";
import { ActionPlanList } from "@/components/ActionPlanList";
import { ActionPlan, Keyword } from "@/lib/types";

export default async function ActionPlanPage() {
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

  const [plans, keywords] = await Promise.all([
    apiFetch<ActionPlan[]>(`/brands/${brandId}/action-plans`, token).catch(
      () => [] as ActionPlan[]
    ),
    apiFetch<Keyword[]>(`/brands/${brandId}/keywords`, token).catch(() => [] as Keyword[]),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl text-slate-900">Plano de Ação</h1>
        <p className="font-mono text-sm text-slate-500 mt-1.5">
          Recomendações por keyword, ordenadas por prioridade
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <p className="font-mono text-sm text-slate-400">
            Nenhum plano de ação disponível ainda.
          </p>
        </div>
      ) : (
        <ActionPlanList plans={plans} keywords={keywords} />
      )}
    </div>
  );
}
