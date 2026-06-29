import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiFetch } from "@/lib/api";
import { KeywordsTable } from "@/components/KeywordsTable";
import { Keyword, Score } from "@/lib/types";

export default async function KeywordsPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const brands = await apiFetch<{ id: string }[]>("/brands", token).catch(() => []);
  const brandId = brands[0]?.id;

  if (!brandId) {
    return <div className="font-mono text-sm text-ink/50">Nenhuma marca cadastrada.</div>;
  }

  const [keywords, scores] = await Promise.all([
    apiFetch<Keyword[]>(`/brands/${brandId}/keywords`, token).catch(() => [] as Keyword[]),
    apiFetch<Score[]>(`/brands/${brandId}/scores`, token).catch(() => [] as Score[]),
  ]);

  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-ink">Keywords</h1>
      <p className="font-mono text-sm text-ink/50 mt-1">GEO Score por keyword (última medição)</p>
      <div className="mt-6 bg-white rounded-xl border border-ink/10 p-6">
        {keywords.length === 0 ? (
          <p className="font-mono text-sm text-ink/40">
            Nenhuma keyword cadastrada.{" "}
            <a href="/settings" className="text-signal hover:underline">Adicionar keywords →</a>
          </p>
        ) : (
          <KeywordsTable keywords={keywords} scores={scores} engineFilter="all" />
        )}
      </div>
    </div>
  );
}
