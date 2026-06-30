"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase-browser";
import { apiFetch } from "@/lib/api";
import { Brand, Keyword } from "@/lib/types";
import { X, Plus, Building2 } from "lucide-react";

export default function SettingsPage() {
  const [token, setToken] = useState("");
  const [brand, setBrand] = useState<Brand | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandWebsite, setNewBrandWebsite] = useState("");
  const [creatingBrand, setCreatingBrand] = useState(false);
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
      const kws = await apiFetch<Keyword[]>(`/brands/${brands[0].id}/keywords`, t).catch(
        () => [] as Keyword[]
      );
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

  async function handleCreateBrand(e: React.FormEvent) {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setCreatingBrand(true);
    await apiFetch("/brands", token, {
      method: "POST",
      body: JSON.stringify({
        name: newBrandName.trim(),
        website: newBrandWebsite.trim() || undefined,
      }),
    });
    setNewBrandName("");
    setNewBrandWebsite("");
    setCreatingBrand(false);
    loadData(token);
  }

  async function handleDeleteKeyword(keywordId: string) {
    if (!brand) return;
    await apiFetch(`/brands/${brand.id}/keywords/${keywordId}`, token, {
      method: "DELETE",
    });
    loadData(token);
  }

  if (loading) {
    return (
      <div className="font-mono text-sm text-slate-400 animate-pulse">
        Carregando...
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl text-slate-900">Configurações</h1>
        <p className="font-mono text-sm text-slate-500 mt-1.5">
          Gerencie sua marca e as keywords monitoradas
        </p>
      </div>

      {/* Marca */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-4">
          Marca monitorada
        </h2>
        {brand ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-moss-50 border border-moss-100 flex items-center justify-center shrink-0">
              <span className="font-display font-black text-sm text-moss-600">
                {brand.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-mono text-sm font-semibold text-slate-900">{brand.name}</p>
              {brand.website && (
                <p className="font-mono text-xs text-slate-400 mt-0.5">{brand.website}</p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateBrand} className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={14} className="text-slate-400" />
              <p className="font-mono text-xs text-slate-500">
                Cadastre sua marca para começar o monitoramento.
              </p>
            </div>
            <input
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Nome da marca (ex: Clínica São Lucas)"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white transition-shadow"
              required
            />
            <input
              value={newBrandWebsite}
              onChange={(e) => setNewBrandWebsite(e.target.value)}
              placeholder="Site (opcional, ex: clinicasaolucas.com.br)"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white transition-shadow"
            />
            <button
              type="submit"
              disabled={creatingBrand}
              className="flex items-center gap-1.5 bg-moss-600 text-white px-4 py-2.5 rounded-xl font-mono text-sm font-semibold hover:bg-moss-700 transition-colors disabled:opacity-60"
            >
              <Plus size={14} />
              {creatingBrand ? "Salvando..." : "Cadastrar marca"}
            </button>
          </form>
        )}
      </div>

      {/* Keywords */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
            Keywords monitoradas
          </h2>
          <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">
            {keywords.length} / 10
          </span>
        </div>

        {keywords.length > 0 && (
          <ul className="space-y-2 mb-5">
            {keywords.map((kw) => (
              <li
                key={kw.id}
                className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-100"
              >
                <span className="font-mono text-sm text-slate-700">{kw.term}</span>
                <button
                  onClick={() => handleDeleteKeyword(kw.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {keywords.length < 10 && brand ? (
          <form onSubmit={handleAddKeyword} className="flex gap-2">
            <input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="ex: advogado trabalhista SP"
              className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white transition-shadow"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-moss-600 text-white px-4 py-2.5 rounded-xl font-mono text-sm font-semibold hover:bg-moss-700 transition-colors shrink-0"
            >
              <Plus size={14} />
              Adicionar
            </button>
          </form>
        ) : keywords.length >= 10 ? (
          <p className="font-mono text-xs text-slate-400 text-center py-2">
            Limite de 10 keywords atingido.
          </p>
        ) : null}
      </div>
    </div>
  );
}
