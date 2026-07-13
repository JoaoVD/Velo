"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase-browser";
import { apiFetch } from "@/lib/api";
import { Brand, Keyword, Competitor } from "@/lib/types";
import { X, Plus, Building2, ExternalLink } from "lucide-react";
import { useToast } from "@/lib/toast";
import Link from "next/link";

export default function SettingsPage() {
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [brand, setBrand] = useState<Brand | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

  // Brand creation form state
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandWebsite, setNewBrandWebsite] = useState("");
  const [creatingBrand, setCreatingBrand] = useState(false);

  // Keyword/competitor input state
  const [newKeyword, setNewKeyword] = useState("");
  const [newCompetitor, setNewCompetitor] = useState("");

  const loadData = useCallback(
    async (t: string) => {
      try {
        const brands = await apiFetch<Brand[]>("/brands", t);
        const b = brands[0] ?? null;
        setBrand(b);
        if (b) {
          const [kws, comps] = await Promise.all([
            apiFetch<Keyword[]>(`/brands/${b.id}/keywords`, t).catch(() => [] as Keyword[]),
            apiFetch<Competitor[]>(`/brands/${b.id}/competitors`, t).catch(
              () => [] as Competitor[]
            ),
          ]);
          setKeywords(kws);
          setCompetitors(comps);
        } else {
          setKeywords([]);
          setCompetitors([]);
        }
      } catch {
        toast("Erro ao carregar dados.", "error");
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      const t = session?.access_token ?? "";
      setToken(t);
      loadData(t);
    });
  }, [loadData]);

  async function handleCreateBrand(e: React.FormEvent) {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setCreatingBrand(true);
    try {
      await apiFetch("/brands", token, {
        method: "POST",
        body: JSON.stringify({
          name: newBrandName.trim(),
          website: newBrandWebsite.trim() || undefined,
        }),
      });
      toast("Marca cadastrada com sucesso!");
      setNewBrandName("");
      setNewBrandWebsite("");
      loadData(token);
    } catch {
      toast("Erro ao cadastrar marca.", "error");
    } finally {
      setCreatingBrand(false);
    }
  }

  async function handleAddKeyword(e: React.FormEvent) {
    e.preventDefault();
    if (!brand || !newKeyword.trim()) return;
    try {
      await apiFetch(`/brands/${brand.id}/keywords`, token, {
        method: "POST",
        body: JSON.stringify({ term: newKeyword.trim() }),
      });
      toast("Keyword adicionada!");
      setNewKeyword("");
      loadData(token);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao adicionar keyword.", "error");
    }
  }

  async function handleDeleteKeyword(id: string) {
    if (!brand) return;
    try {
      await apiFetch(`/brands/${brand.id}/keywords/${id}`, token, { method: "DELETE" });
      toast("Keyword removida.");
      loadData(token);
    } catch {
      toast("Erro ao remover keyword.", "error");
    }
  }

  async function handleAddCompetitor(e: React.FormEvent) {
    e.preventDefault();
    if (!brand || !newCompetitor.trim()) return;
    try {
      await apiFetch(`/brands/${brand.id}/competitors`, token, {
        method: "POST",
        body: JSON.stringify({ name: newCompetitor.trim() }),
      });
      toast("Concorrente adicionado!");
      setNewCompetitor("");
      loadData(token);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao adicionar concorrente.", "error");
    }
  }

  async function handleDeleteCompetitor(id: string) {
    if (!brand) return;
    try {
      await apiFetch(`/brands/${brand.id}/competitors/${id}`, token, { method: "DELETE" });
      toast("Concorrente removido.");
      loadData(token);
    } catch {
      toast("Erro ao remover concorrente.", "error");
    }
  }

  if (loading) {
    return (
      <div className="font-body text-sm text-slate-400 animate-pulse">Carregando...</div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl text-slate-900">Configurações</h1>
        <p className="font-body text-sm text-slate-500 mt-1.5">
          Gerencie sua marca e monitoramento
        </p>
      </div>

      {/* Marca */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,25,35,0.04),0_16px_40px_-20px_rgba(15,25,35,0.12)] p-6">
        <h2 className="font-body text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-4">
          Marca monitorada
        </h2>
        {brand ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-moss-50 border border-moss-100 flex items-center justify-center shrink-0">
              <span className="font-display font-black text-sm text-moss-600">
                {brand.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-slate-900">{brand.name}</p>
              {brand.website && (
                <p className="font-body text-xs text-slate-400 mt-0.5">{brand.website}</p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateBrand} className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={13} className="text-slate-400" />
              <p className="font-body text-xs text-slate-500">
                Cadastre sua marca para começar o monitoramento.
              </p>
            </div>
            <input
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Nome da marca *"
              required
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white"
            />
            <input
              value={newBrandWebsite}
              onChange={(e) => setNewBrandWebsite(e.target.value)}
              placeholder="Site (opcional)"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white"
            />
            <button
              type="submit"
              disabled={creatingBrand}
              className="flex items-center gap-1.5 bg-moss-600 text-white px-5 py-2.5 rounded-full font-body text-sm font-semibold hover:bg-moss-700 transition-colors disabled:opacity-60"
            >
              <Plus size={14} />
              {creatingBrand ? "Salvando..." : "Cadastrar marca"}
            </button>
          </form>
        )}
      </section>

      {/* Keywords */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,25,35,0.04),0_16px_40px_-20px_rgba(15,25,35,0.12)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-body text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
            Keywords monitoradas
          </h2>
          <span className="font-body text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">
            {keywords.length} / 10
          </span>
        </div>
        {keywords.length > 0 && (
          <ul className="space-y-2 mb-4">
            {keywords.map((kw) => (
              <li
                key={kw.id}
                className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <span className="font-body text-sm text-slate-700">{kw.term}</span>
                <button
                  onClick={() => handleDeleteKeyword(kw.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded"
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {brand && keywords.length < 10 ? (
          <form onSubmit={handleAddKeyword} className="flex gap-2">
            <input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="ex: advogado trabalhista SP"
              className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white"
            />
            <button
              type="submit"
              className="flex items-center gap-1 bg-moss-600 text-white px-5 py-2.5 rounded-full font-body text-sm font-semibold hover:bg-moss-700 transition-colors shrink-0"
            >
              <Plus size={13} /> Adicionar
            </button>
          </form>
        ) : keywords.length >= 10 ? (
          <p className="font-body text-xs text-slate-400 text-center py-2">
            Limite de 10 keywords atingido no plano Starter.
          </p>
        ) : null}
      </section>

      {/* Concorrentes */}
      {brand && (
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,25,35,0.04),0_16px_40px_-20px_rgba(15,25,35,0.12)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-body text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              Concorrentes
            </h2>
            <span className="font-body text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">
              {competitors.length} / 3
            </span>
          </div>
          {competitors.length > 0 && (
            <ul className="space-y-2 mb-4">
              {competitors.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <span className="font-body text-sm text-slate-700">{c.name}</span>
                  <button
                    onClick={() => handleDeleteCompetitor(c.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded"
                  >
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {competitors.length < 3 && (
            <form onSubmit={handleAddCompetitor} className="flex gap-2">
              <input
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                placeholder="ex: Concorrente S/A"
                className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white"
              />
              <button
                type="submit"
                className="flex items-center gap-1 bg-slate-700 text-white px-5 py-2.5 rounded-full font-body text-sm font-semibold hover:bg-slate-800 transition-colors shrink-0"
              >
                <Plus size={13} /> Adicionar
              </button>
            </form>
          )}
        </section>
      )}

      {/* Plano atual */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,25,35,0.04),0_16px_40px_-20px_rgba(15,25,35,0.12)] p-6">
        <h2 className="font-body text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-4">
          Plano atual
        </h2>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display font-black text-xl text-slate-900">Starter</p>
            <p className="font-body text-xs text-slate-400 mt-1">
              1 marca · até 10 keywords · scan semanal
            </p>
            <p className="font-body text-xs text-slate-400">
              Keywords usadas: {keywords.length} / 10
            </p>
          </div>
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 font-body text-xs font-semibold text-moss-600 border border-moss-200 px-4 py-2 rounded-full hover:bg-moss-50 transition-colors shrink-0"
          >
            <ExternalLink size={12} /> Fazer upgrade
          </Link>
        </div>
      </section>
    </div>
  );
}
