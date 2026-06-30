import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiFetch } from "@/lib/api";
import { KeywordsTable } from "@/components/KeywordsTable";
import { Keyword, Score } from "@/lib/types";
import Link from "next/link";

export default async function KeywordsPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const brands = await apiFetch<{ id: string }[]>("/brands", token).catch(() => []);
  const brandId = brands[0]?.id;

  if (!brandId) {
    return (
      <div className="font-mono text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-10 text-center">
        Nenhuma marca cadastrada.{" "}
        <Link href="/settings" className="text-moss-600 hover:underline font-medium">
          Adicionar →
        </Link>
      </div>
    );
  }

  const [keywords, scores] = await Promise.all([
    apiFetch<Keyword[]>(`/brands/${brandId}/keywords`, token).catch(() => [] as Keyword[]),
    apiFetch<Score[]>(`/brands/${brandId}/scores`, token).catch(() => [] as Score[]),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl text-slate-900">Keywords</h1>
        <p className="font-mono text-sm text-slate-500 mt-1.5">
          GEO Score por keyword — última medição
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {keywords.length === 0 ? (
          <div className="text-center py-8">
            <p className="font-mono text-sm text-slate-400 mb-3">
              Nenhuma keyword cadastrada.
            </p>
            <Link href="/settings" className="font-mono text-sm text-moss-600 hover:underline font-semibold">
              Adicionar keywords →
            </Link>
          </div>
        ) : (
          <KeywordsTable keywords={keywords} scores={scores} engineFilter="all" />
        )}
      </div>
    </div>
  );
}
