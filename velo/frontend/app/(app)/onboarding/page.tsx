"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient as createBrowserClient } from "@/lib/supabase-browser";
import { apiFetch } from "@/lib/api";
import { X, Plus, ArrowRight } from "lucide-react";

const SECTORS = ["Advocacia", "Saúde", "Consultoria", "Educação", "E-commerce", "Outro"];

export default function OnboardingPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Brand fields
  const [brandName, setBrandName] = useState("");
  const [brandWebsite, setBrandWebsite] = useState("");
  const [brandSector, setBrandSector] = useState("");

  // Keywords
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState("");

  // Competitors
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [compInput, setCompInput] = useState("");

  useEffect(() => {
    let cancelled = false;
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const t = session?.access_token ?? "";
      if (cancelled) return;
      if (!t) {
        router.replace("/auth/login");
        return;
      }
      setToken(t);
      // If brand already exists, skip onboarding
      try {
        const brands = await apiFetch<{ id: string }[]>("/brands", t);
        if (!cancelled && brands[0]) {
          router.replace("/dashboard");
          return;
        }
      } catch (err) {
        console.error("Erro ao verificar marcas existentes:", err);
      }
      if (!cancelled) setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  function addKeyword(e: React.FormEvent) {
    e.preventDefault();
    const term = kwInput.trim();
    if (!term || keywords.includes(term) || keywords.length >= 10) return;
    setKeywords((k) => [...k, term]);
    setKwInput("");
  }

  function addCompetitor(e: React.FormEvent) {
    e.preventDefault();
    const name = compInput.trim();
    if (!name || competitors.includes(name) || competitors.length >= 3) return;
    setCompetitors((c) => [...c, name]);
    setCompInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brandName.trim() || !brandSector) {
      setError("Preencha o nome da marca e o setor.");
      return;
    }
    if (keywords.length === 0) {
      setError("Adicione pelo menos 1 keyword.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const brand = await apiFetch<{ id: string }>("/brands", token, {
        method: "POST",
        body: JSON.stringify({
          name: brandName.trim(),
          website: brandWebsite.trim() || undefined,
        }),
      });
      await Promise.all([
        ...keywords.map((term) =>
          apiFetch(`/brands/${brand.id}/keywords`, token, {
            method: "POST",
            body: JSON.stringify({ term }),
          })
        ),
        ...competitors.map((name) =>
          apiFetch(`/brands/${brand.id}/competitors`, token, {
            method: "POST",
            body: JSON.stringify({ name }),
          })
        ),
      ]);
      router.push("/dashboard?onboarded=1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar. Tente novamente.");
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="font-mono text-sm text-slate-400 animate-pulse">Carregando...</div>
      </div>
    );
  }

  const step1Done = !!brandName.trim() && !!brandSector;
  const step2Done = keywords.length > 0;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display font-black text-3xl text-slate-900 mb-2">
            Configure seu monitoramento
          </h1>
          <p className="font-mono text-sm text-slate-400">
            Leva menos de 4 minutos. Primeiro resultado em até 24h.
          </p>
          {/* Progress dots */}
          <div className="flex justify-center gap-4 mt-5">
            {[
              { label: "Marca", done: step1Done },
              { label: "Keywords", done: step2Done },
              { label: "Concorrentes", done: true },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    done ? "bg-moss-600" : "bg-slate-200"
                  }`}
                />
                <span className="font-mono text-[10px] text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Passo 1 — Marca */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-4">
              01 — Sua marca
            </h2>
            <div className="space-y-3">
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Nome da empresa *"
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white"
              />
              <input
                value={brandWebsite}
                onChange={(e) => setBrandWebsite(e.target.value)}
                placeholder="Site (opcional, ex: clinicasaolucas.com.br)"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white"
              />
              <select
                value={brandSector}
                onChange={(e) => setBrandSector(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white appearance-none"
              >
                <option value="">Setor *</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Passo 2 — Keywords */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                02 — Keywords para monitorar
              </h2>
              <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                {keywords.length} / 10
              </span>
            </div>
            <p className="font-mono text-xs text-slate-400 mb-4">
              Termos que seus clientes usariam para te encontrar nas IAs.
            </p>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="flex items-center gap-1 bg-moss-50 border border-moss-100 text-moss-700 font-mono text-xs px-2.5 py-1 rounded-full"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => setKeywords((k) => k.filter((x) => x !== kw))}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {keywords.length < 10 && (
              <div className="flex gap-2">
                <input
                  value={kwInput}
                  onChange={(e) => setKwInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword(e as unknown as React.FormEvent);
                    }
                  }}
                  placeholder="ex: advogado trabalhista SP"
                  className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="flex items-center gap-1 bg-moss-600 text-white px-3.5 py-2 rounded-xl font-mono text-xs font-semibold hover:bg-moss-700 transition-colors"
                >
                  <Plus size={13} /> Adicionar
                </button>
              </div>
            )}
          </section>

          {/* Passo 3 — Concorrentes */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                03 — Concorrentes{" "}
                <span className="text-slate-300 normal-case font-normal">(opcional)</span>
              </h2>
              <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                {competitors.length} / 3
              </span>
            </div>
            <p className="font-mono text-xs text-slate-400 mb-4">
              Saberemos quando eles aparecem no lugar de você.
            </p>
            {competitors.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {competitors.map((c) => (
                  <span
                    key={c}
                    className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 font-mono text-xs px-2.5 py-1 rounded-full"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => setCompetitors((arr) => arr.filter((x) => x !== c))}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {competitors.length < 3 && (
              <div className="flex gap-2">
                <input
                  value={compInput}
                  onChange={(e) => setCompInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCompetitor(e as unknown as React.FormEvent);
                    }
                  }}
                  placeholder="ex: Concorrente S/A"
                  className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white"
                />
                <button
                  type="button"
                  onClick={addCompetitor}
                  className="flex items-center gap-1 bg-slate-700 text-white px-3.5 py-2 rounded-xl font-mono text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  <Plus size={13} /> Adicionar
                </button>
              </div>
            )}
          </section>

          {error && (
            <p className="font-mono text-xs text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-moss-600 text-white py-3.5 rounded-xl font-mono text-sm font-semibold hover:bg-moss-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              "Salvando..."
            ) : (
              <>
                <ArrowRight size={16} /> Iniciar monitoramento
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
