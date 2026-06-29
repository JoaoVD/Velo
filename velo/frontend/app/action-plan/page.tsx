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
    return <div className="font-mono text-sm text-ink/50">Nenhuma marca cadastrada.</div>;
  }

  const [plans, keywords] = await Promise.all([
    apiFetch<ActionPlan[]>(`/brands/${brandId}/action-plans`, token).catch(() => [] as ActionPlan[]),
    apiFetch<Keyword[]>(`/brands/${brandId}/keywords`, token).catch(() => [] as Keyword[]),
  ]);

  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-ink">Plano de Ação</h1>
      <p className="font-mono text-sm text-ink/50 mt-1">Recomendações por keyword, ordenadas por prioridade</p>
      <div className="mt-6">
        {plans.length === 0 ? (
          <p className="font-mono text-sm text-ink/40">Nenhum plano de ação disponível ainda.</p>
        ) : (
          <ActionPlanList plans={plans} keywords={keywords} />
        )}
      </div>
    </div>
  );
}
