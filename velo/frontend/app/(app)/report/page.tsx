import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiFetch } from "@/lib/api";
import { ReportViewer } from "@/components/ReportViewer";
import { Report } from "@/lib/types";

export default async function ReportPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const brands = await apiFetch<{ id: string }[]>("/brands", token).catch(() => []);
  const brandId = brands[0]?.id;

  if (!brandId) {
    return (
      <div className="font-mono text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-10 text-center">
        Nenhuma marca cadastrada.
      </div>
    );
  }

  let report: Report | null = null;
  try {
    report = await apiFetch<Report>(`/brands/${brandId}/reports/latest`, token);
  } catch {
    report = null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl text-slate-900">Relatório Semanal</h1>
        {report && (
          <p className="font-mono text-sm text-slate-500 mt-1.5">
            Período: {report.period_start} — {report.period_end}
          </p>
        )}
      </div>

      {report ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <ReportViewer markdown={report.content_md} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <p className="font-mono text-sm text-slate-400">
            Nenhum relatório disponível ainda. O primeiro será gerado ao final da semana.
          </p>
        </div>
      )}
    </div>
  );
}
