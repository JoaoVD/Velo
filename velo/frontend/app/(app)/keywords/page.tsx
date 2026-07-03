import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiFetch } from "@/lib/api";
import { KeywordsTable } from "@/components/KeywordsTable";
import { Keyword, Score } from "@/lib/types";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function KeywordsPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");
  const token = session.access_token;

  const brands = await apiFetch<{ id: string }[]>("/brands", token).catch(() => []);
  const brandId = brands[0]?.id;
  if (!brandId) redirect("/onboarding");

  const [keywords, scores] = await Promise.all([
    apiFetch<Keyword[]>(`/brands/${brandId}/keywords`, token).catch(() => [] as Keyword[]),
    apiFetch<Score[]>(`/brands/${brandId}/scores`, token).catch(() => [] as Score[]),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl text-slate-900">Keywords</h1>
        <p className="font-mono text-sm text-slate-500 mt-1.5">GEO Score por keyword — última medição</p>
      </div>
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,25,35,0.04),0_16px_40px_-20px_rgba(15,25,35,0.12)] p-6">
        {keywords.length === 0 ? (
          <div className="text-center py-10">
            <p className="font-display font-black text-lg text-slate-700 mb-2">Nenhuma keyword ainda</p>
            <p className="font-mono text-sm text-slate-400 mb-4">Adicione keywords em Configurações para começar o monitoramento.</p>
            <Link href="/settings" className="font-mono text-sm text-moss-600 hover:underline font-semibold">
              Ir para Configurações →
            </Link>
          </div>
        ) : (
          <KeywordsTable keywords={keywords} scores={scores} engineFilter="all" />
        )}
      </div>
    </div>
  );
}
