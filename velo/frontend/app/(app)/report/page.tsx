import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiFetch } from "@/lib/api";
import { ReportViewer } from "@/components/ReportViewer";
import { Report } from "@/lib/types";
import { redirect } from "next/navigation";
import { FileDown } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function ReportPage() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const brands = await apiFetch<{ id: string }[]>("/brands", token).catch(() => []);
  const brandId = brands[0]?.id;
  if (!brandId) redirect("/onboarding");

  let report: Report | null = null;
  try {
    report = await apiFetch<Report>(`/brands/${brandId}/reports/latest`, token);
  } catch {
    report = null;
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start gap-4 justify-between">
        <div>
          <h1 className="font-display font-black text-3xl text-slate-900">
            Relatório Semanal
          </h1>
          {report && (
            <p className="font-mono text-sm text-slate-500 mt-1.5">
              Período: {formatDate(report.period_start)} — {formatDate(report.period_end)}
            </p>
          )}
        </div>
        {report && (
          <button
            disabled={!report.pdf_url}
            title={!report.pdf_url ? "Disponível no plano Pro" : "Baixar PDF"}
            className="flex items-center gap-1.5 font-mono text-xs border border-slate-200 px-3.5 py-2 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileDown size={13} /> Baixar PDF
          </button>
        )}
      </div>

      {report ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <ReportViewer markdown={report.content_md} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <p className="font-display font-black text-lg text-slate-700 mb-2">
            Nenhum relatório ainda
          </p>
          <p className="font-mono text-sm text-slate-400 max-w-sm mx-auto">
            O relatório semanal é gerado toda segunda-feira após o primeiro ciclo completo.
          </p>
        </div>
      )}
    </div>
  );
}
