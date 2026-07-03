"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/lib/toast";
import { createClient } from "@/lib/supabase-browser";
import { apiFetch } from "@/lib/api";

export default function ForceScanButton({ brandId }: { brandId: string }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleScan() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessão expirada. Faça login novamente.");
      await apiFetch(`/brands/${brandId}/scan`, token, { method: "POST" });
      toast("Scan agendado! Resultado em até 24h.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao agendar scan. Tente novamente.";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleScan}
      disabled={loading}
      className="flex items-center gap-1.5 font-mono text-xs text-slate-600 border border-slate-200 bg-white px-4 py-2 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50"
    >
      <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
      {loading ? "Agendando..." : "Forçar scan"}
    </button>
  );
}
