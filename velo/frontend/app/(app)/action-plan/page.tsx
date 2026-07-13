import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiFetch } from "@/lib/api";
import { ActionPlanList } from "@/components/ActionPlanList";
import { ActionPlan, Keyword } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function ActionPlanPage() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");
  const token = session.access_token;

  const brands = await apiFetch<{ id: string }[]>("/brands", token).catch(() => []);
  const brandId = brands[0]?.id;
  if (!brandId) redirect("/onboarding");

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
        <p className="font-body text-sm text-slate-500 mt-1.5">
          Recomendações por keyword, ordenadas por prioridade
        </p>
      </div>
      {plans.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,25,35,0.04),0_16px_40px_-20px_rgba(15,25,35,0.12)] p-12 text-center">
          <p className="font-display font-black text-lg text-slate-700 mb-2">
            Nenhum plano de ação ainda
          </p>
          <p className="font-body text-sm text-slate-400 max-w-sm mx-auto">
            Gerado automaticamente após análise dos primeiros scans.
          </p>
        </div>
      ) : (
        <ActionPlanList plans={plans} keywords={keywords} />
      )}
    </div>
  );
}
