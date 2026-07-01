"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/lib/toast";

export default function ForceScanButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleScan() {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/internal/create-jobs`,
        {
          method: "POST",
          headers: {
            "X-Internal-Key": process.env.NEXT_PUBLIC_INTERNAL_KEY ?? "",
          },
        }
      );
      if (!res.ok) throw new Error("Erro ao agendar scan");
      toast("Scan agendado! Resultado em até 24h.");
    } catch {
      toast("Erro ao agendar scan. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleScan}
      disabled={loading}
      className="flex items-center gap-1.5 font-mono text-xs text-slate-600 border border-slate-200 bg-white px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
    >
      <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
      {loading ? "Agendando..." : "Forçar scan"}
    </button>
  );
}
