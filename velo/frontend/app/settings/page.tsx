"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase-browser";
import { apiFetch } from "@/lib/api";
import { Brand, Keyword } from "@/lib/types";

export default function SettingsPage() {
  const [token, setToken] = useState("");
  const [brand, setBrand] = useState<Brand | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      const t = session?.access_token ?? "";
      setToken(t);
      loadData(t);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData(t: string) {
    const brands = await apiFetch<Brand[]>("/brands", t).catch(() => [] as Brand[]);
    if (brands[0]) {
      setBrand(brands[0]);
      const kws = await apiFetch<Keyword[]>(`/brands/${brands[0].id}/keywords`, t).catch(() => [] as Keyword[]);
      setKeywords(kws);
    }
    setLoading(false);
  }

  async function handleAddKeyword(e: React.FormEvent) {
    e.preventDefault();
    if (!brand || !newKeyword.trim()) return;
    await apiFetch(`/brands/${brand.id}/keywords`, token, {
      method: "POST",
      body: JSON.stringify({ term: newKeyword.trim() }),
    });
    setNewKeyword("");
    loadData(token);
  }

  async function handleDeleteKeyword(keywordId: string) {
    if (!brand) return;
    await apiFetch(`/brands/${brand.id}/keywords/${keywordId}`, token, { method: "DELETE" });
    loadData(token);
  }

  if (loading) return <div className="font-mono text-sm text-ink/40">Carregando...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display font-bold text-3xl text-ink">Configurações</h1>

      <div className="mt-6 bg-white rounded-xl border border-ink/10 p-6">
        <h2 className="font-mono text-sm font-semibold text-ink mb-4">Marca monitorada</h2>
        {brand ? (
          <p className="font-mono text-sm text-ink">{brand.name}</p>
        ) : (
          <p className="font-mono text-sm text-ink/40">Nenhuma marca cadastrada.</p>
        )}
      </div>

      <div className="mt-4 bg-white rounded-xl border border-ink/10 p-6">
        <h2 className="font-mono text-sm font-semibold text-ink mb-4">
          Keywords ({keywords.length}/10)
        </h2>
        <ul className="space-y-2 mb-4">
          {keywords.map((kw) => (
            <li key={kw.id} className="flex items-center justify-between">
              <span className="font-mono text-sm text-ink">{kw.term}</span>
              <button
                onClick={() => handleDeleteKeyword(kw.id)}
                className="font-mono text-xs text-red-600 hover:text-red-800"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
        {keywords.length < 10 && brand && (
          <form onSubmit={handleAddKeyword} className="flex gap-2">
            <input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="ex: advogado trabalhista SP"
              className="flex-1 border border-ink/20 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-signal bg-bone"
            />
            <button
              type="submit"
              className="bg-signal text-white px-4 py-2 rounded-lg font-mono text-sm font-medium hover:bg-signal/90 transition-colors"
            >
              Adicionar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
