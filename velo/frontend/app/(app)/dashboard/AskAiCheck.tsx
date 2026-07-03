"use client";
import { useState } from "react";
import { MessageCircleQuestion, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { apiFetch } from "@/lib/api";

interface AiCheckResult {
  mentioned: boolean;
  position: number | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  snippet: string;
  remaining_today: number;
}

const SENTIMENT_LABELS: Record<string, string> = {
  positive: "descrita positivamente",
  neutral: "citada de forma neutra",
  negative: "descrita com críticas",
};

export default function AskAiCheck({ brandId, brandName }: { brandId: string; brandName: string }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiCheckResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (question.trim().length < 3) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessão expirada. Faça login novamente.");
      const res = await apiFetch<AiCheckResult>(`/brands/${brandId}/ai-check`, token, {
        method: "POST",
        body: JSON.stringify({ keyword: question.trim() }),
        signal: AbortSignal.timeout(60000),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível verificar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,25,35,0.04),0_16px_40px_-20px_rgba(15,25,35,0.12)] p-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-moss-50 text-moss-600">
          <MessageCircleQuestion size={16} />
        </span>
        <h2 className="font-display font-bold text-base text-slate-900">
          Pergunte como seu cliente
        </h2>
      </div>
      <p className="font-mono text-xs text-slate-400 mb-5 ml-[42px]">
        Digite qualquer pergunta e veja na hora se o ChatGPT menciona a {brandName}.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          minLength={3}
          maxLength={120}
          required
          placeholder="ex: qual a melhor clínica odontológica em Campinas?"
          className="flex-1 border border-slate-200 rounded-full px-5 py-3 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-slate-50/60 focus:bg-white transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 bg-moss-600 text-white font-mono text-sm font-semibold rounded-full px-6 py-3 shadow-[0_8px_20px_-6px_rgba(63,107,78,0.4)] hover:bg-moss-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Perguntando…" : "Perguntar"}
          {!loading && <ArrowRight size={14} />}
        </button>
      </form>

      {error && (
        <p className="mt-4 font-mono text-xs text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span
              className={`inline-block font-mono text-[11px] uppercase tracking-widest font-semibold rounded-full px-4 py-1.5 ${
                result.mentioned
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {result.mentioned ? "✓ Marca mencionada" : "✗ Marca não mencionada"}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {result.remaining_today} perguntas restantes hoje
            </span>
          </div>
          {result.mentioned && (
            <p className="font-mono text-sm text-slate-600 mb-3">
              {result.position !== null && (
                <>Aparece na <strong className="text-slate-900">posição {result.position}</strong></>
              )}
              {result.sentiment && SENTIMENT_LABELS[result.sentiment] && (
                <>{result.position !== null ? ", " : "Sua marca é "}{SENTIMENT_LABELS[result.sentiment]}.</>
              )}
            </p>
          )}
          <blockquote className="rounded-2xl rounded-tl-md bg-slate-50 px-5 py-4 font-mono text-[13px] leading-[1.7] text-slate-500">
            &ldquo;{result.snippet}…&rdquo;
          </blockquote>
        </div>
      )}
    </div>
  );
}
